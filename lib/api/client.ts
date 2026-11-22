/**
 * NichePop 页面调用接口用的客户端：走模板的 apiRequest（lib/api.ts），
 * 带上当前登录的 token，地址来自 NEXT_PUBLIC_API_BASE_URL；401 时清掉登录状态。
 */

import { apiRequest } from '@/lib/api';
import { readSession } from '@/lib/auth';

function withQuery(endpoint: string, params?: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const search = query.toString();
  return search ? `${endpoint}?${search}` : endpoint;
}

export class ApiClient {
  private request<T>(endpoint: string, method: string, data?: unknown): Promise<T> {
    return apiRequest<T>(endpoint, { method, authToken: readSession()?.token, json: data });
  }

  get<T>(endpoint: string, params?: object): Promise<T> {
    return this.request<T>(withQuery(endpoint, params), 'GET');
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, 'POST', data);
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data);
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', data);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'DELETE');
  }
}

export const apiClient = new ApiClient();
