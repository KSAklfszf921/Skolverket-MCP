/**
 * Base HTTP-klient för alla Skolverkets API:er
 * Med caching, rate limiting och förbättrad felhantering
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import pLimit from 'p-limit';
import { v4 as uuidv4 } from 'uuid';
import { log, createRequestLogger } from '../logger.js';
import { cache } from '../cache.js';
import { SkolverketApiError, RateLimitError, AuthenticationError, TransientError } from '../errors.js';

export interface BaseClientConfig {
  baseURL: string;
  timeout?: number;
  userAgent?: string;
  maxConcurrent?: number; // Max antal samtidiga requests
  maxRetries?: number; // Max antal retries (default: 3)
  retryDelay?: number; // Base delay mellan retries i ms (default: 1000)
  apiKey?: string; // API-nyckel om krävs
  authHeader?: string; // Namn på auth header (default: 'Authorization')
}

export class BaseApiClient {
  protected client: AxiosInstance;
  private limiter: ReturnType<typeof pLimit>;

  constructor(config: BaseClientConfig) {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': config.userAgent || 'skolverket-mcp/2.1.0'
    };

    // Lägg till API-nyckel om angiven
    if (config.apiKey) {
      const authHeaderName = config.authHeader || 'Authorization';
      headers[authHeaderName] = `Bearer ${config.apiKey}`;
    }

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers
    });

    // Konfigurera axios-retry med exponentiell backoff
    axiosRetry(this.client, {
      retries: config.maxRetries || 3,
      retryDelay: (retryCount) => {
        const baseDelay = config.retryDelay || 1000;
        return baseDelay * Math.pow(2, retryCount - 1); // Exponentiell backoff
      },
      retryCondition: (error: AxiosError) => {
        // Retry på nätverksfel eller 5xx errors
        if (!error.response) return true; // Nätverksfel
        const status = error.response.status;
        // Retry på 429 (rate limit), 500, 502, 503, 504
        return status === 429 || (status >= 500 && status <= 504);
      },
      onRetry: (retryCount, error, requestConfig) => {
        log.warn(`Retrying request (attempt ${retryCount})`, {
          url: requestConfig.url,
          method: requestConfig.method,
          error: error.message
        });
      }
    });

    // Rate limiter - konfigurerbar via env eller config
    this.limiter = pLimit(config.maxConcurrent || 5);

    // Lägg till request interceptor för logging
    this.client.interceptors.request.use(
      (config) => {
        log.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        log.error('API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Lägg till response interceptor för error handling
    this.client.interceptors.response.use(
      (response) => {
        log.debug('API Response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): never {
    const requestId = uuidv4();
    const reqLog = createRequestLogger(requestId);
    const url = error.config?.url || 'unknown';
    const timestamp = new Date().toISOString();

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      reqLog.error('API Error Response', {
        status,
        url,
        data,
        headers: error.response.headers
      });

      // Autentiseringsfel
      if (status === 401 || status === 403) {
        throw new AuthenticationError(
          status === 401
            ? 'API authentication failed. Check if API key is required and valid.'
            : 'Access forbidden. Check API permissions.',
          url
        );
      }

      // Rate limiting
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        throw new RateLimitError(
          'API rate limit reached. Please retry after the specified time.',
          retryAfter ? parseInt(retryAfter) : undefined
        );
      }

      // Tillfälliga fel (5xx)
      if (status >= 500 && status <= 504) {
        throw new TransientError(
          'Temporary server error. The request can be retried.',
          status,
          url
        );
      }

      // Övriga API-fel
      const errorMessage = this.formatErrorMessage(status, data);
      throw new SkolverketApiError(
        errorMessage,
        status,
        data,
        'API_ERROR',
        url,
        (error.config as any)?.['axios-retry']?.retryCount || 1,
        timestamp
      );

    } else if (error.request) {
      reqLog.error('API Network Error', {
        message: error.message,
        url,
        code: error.code
      });
      throw new TransientError(
        'Could not reach the API. Check your internet connection.',
        undefined,
        url
      );
    } else {
      reqLog.error('API Request Setup Error', {
        message: error.message,
        url
      });
      throw new SkolverketApiError(
        `Request configuration error: ${error.message}`,
        undefined,
        undefined,
        'CONFIG_ERROR',
        url,
        1,
        timestamp
      );
    }
  }

  private formatErrorMessage(status: number, data: any): string {
    if (typeof data === 'object' && data !== null) {
      if (data.detail) {
        return `Skolverket API error (${status}): ${data.detail}`;
      }
      if (data.message) {
        return `Skolverket API error (${status}): ${data.message}`;
      }
    }

    return `Skolverket API error: ${status} - ${JSON.stringify(data)}`;
  }

  /**
   * GET-request med rate limiting
   */
  protected async get<T>(url: string, params?: any): Promise<T> {
    return this.limiter(async () => {
      const response = await this.client.get<T>(url, { params });
      return response.data;
    });
  }

  /**
   * GET-request med caching och rate limiting
   */
  protected async getCached<T>(
    url: string,
    params?: any,
    ttl: number = 3600000
  ): Promise<T> {
    // Skapa cache key från URL och params
    const cacheKey = `${url}:${JSON.stringify(params || {})}`;

    return cache.getOrFetch(
      cacheKey,
      () => this.get<T>(url, params),
      ttl
    );
  }

  /**
   * POST-request med rate limiting
   */
  protected async post<T>(url: string, data?: any): Promise<T> {
    return this.limiter(async () => {
      const response = await this.client.post<T>(url, data);
      return response.data;
    });
  }

  /**
   * PUT-request med rate limiting
   */
  protected async put<T>(url: string, data?: any): Promise<T> {
    return this.limiter(async () => {
      const response = await this.client.put<T>(url, data);
      return response.data;
    });
  }

  /**
   * DELETE-request med rate limiting
   */
  protected async delete<T>(url: string): Promise<T> {
    return this.limiter(async () => {
      const response = await this.client.delete<T>(url);
      return response.data;
    });
  }
}
