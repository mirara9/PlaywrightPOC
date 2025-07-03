import { APIRequestContext, APIResponse, expect } from '@playwright/test';

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  data?: any;
  params?: Record<string, string>;
}

export abstract class BaseApiWrapper {
  protected request: APIRequestContext;
  protected config: ApiConfig;

  constructor(request: APIRequestContext, config: ApiConfig) {
    this.request = request;
    this.config = config;
  }

  protected async get(endpoint: string, options?: RequestOptions): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options?.params);
    return await this.request.get(url, {
      headers: { ...this.config.headers, ...options?.headers },
      timeout: options?.timeout || this.config.timeout,
    });
  }

  protected async post(endpoint: string, options?: RequestOptions): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options?.params);
    return await this.request.post(url, {
      headers: { ...this.config.headers, ...options?.headers },
      data: options?.data,
      timeout: options?.timeout || this.config.timeout,
    });
  }

  protected async put(endpoint: string, options?: RequestOptions): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options?.params);
    return await this.request.put(url, {
      headers: { ...this.config.headers, ...options?.headers },
      data: options?.data,
      timeout: options?.timeout || this.config.timeout,
    });
  }

  protected async patch(endpoint: string, options?: RequestOptions): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options?.params);
    return await this.request.patch(url, {
      headers: { ...this.config.headers, ...options?.headers },
      data: options?.data,
      timeout: options?.timeout || this.config.timeout,
    });
  }

  protected async delete(endpoint: string, options?: RequestOptions): Promise<APIResponse> {
    const url = this.buildUrl(endpoint, options?.params);
    return await this.request.delete(url, {
      headers: { ...this.config.headers, ...options?.headers },
      timeout: options?.timeout || this.config.timeout,
    });
  }

  protected buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.config.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  protected async expectStatus(response: APIResponse, expectedStatus: number): Promise<void> {
    expect(response.status()).toBe(expectedStatus);
  }

  protected async expectJson(response: APIResponse): Promise<any> {
    expect(response.headers()['content-type']).toContain('application/json');
    return await response.json();
  }

}