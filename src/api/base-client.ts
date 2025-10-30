/**
 * Base HTTP-klient för alla Skolverkets API:er
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface BaseClientConfig {
  baseURL: string;
  timeout?: number;
  userAgent?: string;
}

export class BaseApiClient {
  protected client: AxiosInstance;

  constructor(config: BaseClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': config.userAgent || 'skolverket-mcp/2.0.0'
      }
    });

    // Lägg till error handler
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          const errorMessage = this.formatErrorMessage(error);
          throw new Error(errorMessage);
        } else if (error.request) {
          throw new Error('Kunde inte nå Skolverkets API. Kontrollera internetanslutningen.');
        } else {
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  private formatErrorMessage(error: AxiosError): string {
    const status = error.response?.status;
    const data = error.response?.data;

    if (typeof data === 'object' && data !== null) {
      const errorObj = data as any;
      if (errorObj.detail) {
        return `Skolverket API error (${status}): ${errorObj.detail}`;
      }
      if (errorObj.message) {
        return `Skolverket API error (${status}): ${errorObj.message}`;
      }
    }

    return `Skolverket API error: ${status} - ${JSON.stringify(data)}`;
  }

  /**
   * Hjälpmetod för att hantera GET-requests med bättre felhantering
   */
  protected async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  /**
   * Hjälpmetod för att hantera POST-requests
   */
  protected async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }
}
