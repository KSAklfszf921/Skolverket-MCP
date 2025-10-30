/**
 * Base HTTP-klient för alla Skolverkets API:er
 * Med caching, rate limiting och förbättrad felhantering
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import pLimit from 'p-limit';
import { log } from '../logger.js';
import { cache } from '../cache.js';
import { SkolverketApiError, RateLimitError } from '../errors.js';

export interface BaseClientConfig {
  baseURL: string;
  timeout?: number;
  userAgent?: string;
  maxConcurrent?: number; // Max antal samtidiga requests
}

export class BaseApiClient {
  protected client: AxiosInstance;
  private limiter: ReturnType<typeof pLimit>;

  constructor(config: BaseClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': config.userAgent || 'skolverket-mcp/2.1.0'
      }
    });

    // Rate limiter - max 5 samtidiga requests per default
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
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      log.error('API Error Response', {
        status,
        url: error.config?.url,
        data
      });

      // Rate limiting
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        throw new RateLimitError(
          'API rate limit nådd. Försök igen senare.',
          retryAfter ? parseInt(retryAfter) : undefined
        );
      }

      // Formatera error message
      const errorMessage = this.formatErrorMessage(status, data);
      throw new SkolverketApiError(errorMessage, status, data);

    } else if (error.request) {
      log.error('API Network Error', {
        message: error.message,
        url: error.config?.url
      });
      throw new SkolverketApiError(
        'Kunde inte nå Skolverkets API. Kontrollera internetanslutningen.'
      );
    } else {
      log.error('API Request Setup Error', { message: error.message });
      throw new SkolverketApiError(`Request error: ${error.message}`);
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
