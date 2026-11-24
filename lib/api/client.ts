/**
 * NichePop 页面调用接口用的客户端：走模板的 apiRequest（lib/api.ts），
 * 带上当前登录的 token，地址来自 NEXT_PUBLIC_API_BASE_URL；401 时清掉登录状态。
 * 用相对路径引用，lib/api/* 才能在 tests/ 里直接测。
 */

import { ApiError, apiRequest, type ApiEnvelope } from '../api';
import { clearSessionIfToken, readSession } from '../auth';
import { apiUrl } from '../env';

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

  /**
   * For the Agent endpoints that answer 201/202 with the bare object instead of the
   * envelope (creating a conversation, sending a message, starting a report). Errors
   * still come in the envelope and become an ApiError, as with apiRequest.
   */
  async postBare<T>(endpoint: string, data?: unknown): Promise<T> {
    const token = readSession()?.token;
    const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(apiUrl(endpoint), { method: 'POST', headers, body: JSON.stringify(data ?? {}), cache: 'no-store' });
    const body = (response.headers.get('content-type') || '').includes('application/json') ? await response.json() : null;
    if (response.ok) return body as T;
    const envelope = body as ApiEnvelope<unknown> | null;
    if (response.status === 401 && token) clearSessionIfToken(token);
    throw new ApiError(envelope?.msg?.trim() || `http ${response.status}`, response.status, envelope?.code ?? response.status, envelope?.data, response.headers.get('x-request-id') || '');
  }
}

export const apiClient = new ApiClient();

/** One path segment, escaped. */
export const segment = (value: string) => encodeURIComponent(value);

/** NichePop's reason for a refusal, from `data.code`: e.g. PLAN_LIMIT_REACHED, DUPLICATE, BUSY, INSUFFICIENT_CREDITS; "" otherwise. */
export function errorCode(error: unknown): string {
  const code = error instanceof ApiError ? (error.data as { code?: unknown } | null | undefined)?.code : undefined;
  return typeof code === 'string' ? code : '';
}
