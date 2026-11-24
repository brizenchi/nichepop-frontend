/**
 * Keyword API 服务
 * 处理所有关键词相关的 API 调用
 */

import { apiClient } from '../client';
import type {
  Keyword,
  KeywordDetailData,
  KeywordListParams,
  KeywordListResponse,
  KeywordListData,
  UnlockKeywordResponse,
} from '@/lib/types';

/** 旧版 /dashboard 用的关键词接口（frontend#16 删除旧版后一起删掉）。 */
const KEYWORD = {
  LIST: '/keyword/list',
  DETAIL: (id: number) => `/keyword/detail/${id}`,
  CREATE: '/keyword',
  UPDATE: (id: number) => `/keyword/${id}`,
  DELETE: (id: number) => `/keyword/${id}`,
  SEARCH: '/keyword/search',
  UNLOCK: (id: number) => `/keyword/unlock/${id}`,
} as const;

/**
 * Keyword 服务类
 */
class KeywordService {
  /**
   * 获取关键词列表
   * @param params - 查询参数（limit, offset, keyword_status, search）
   * @returns 关键词列表数据（包含 items, total, limit, offset, total_pages）
   */
  async getList(params?: KeywordListParams): Promise<KeywordListData> {
    // apiClient.get 已经通过 unwrapApiResponse 自动解包了 data 字段
    // 返回的是 { items: [], total: number, limit: number, offset: number, total_pages: number }
    return apiClient.get<KeywordListData>(
      KEYWORD.LIST,
      params
    );
  }

  /**
   * 获取关键词详情
   * @param id - 关键词 ID
   * @returns 关键词详情
   */
  async getDetail(id: number): Promise<KeywordDetailData> {
    return apiClient.get<KeywordDetailData>(KEYWORD.DETAIL(id));
  }

  /**
   * 创建关键词
   * @param data - 关键词数据
   * @returns 创建的关键词
   */
  async create(data: Partial<Keyword>): Promise<Keyword> {
    return apiClient.post<Keyword>(KEYWORD.CREATE, data);
  }

  /**
   * 更新关键词
   * @param id - 关键词 ID
   * @param data - 更新的数据
   * @returns 更新后的关键词
   */
  async update(id: number, data: Partial<Keyword>): Promise<Keyword> {
    return apiClient.put<Keyword>(KEYWORD.UPDATE(id), data);
  }

  /**
   * 删除关键词
   * @param id - 关键词 ID
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(KEYWORD.DELETE(id));
  }

  /**
   * 搜索关键词
   * @param query - 搜索关键词
   * @param params - 其他查询参数
   * @returns 关键词列表数据（包含 items, total, limit, offset, total_pages）
   */
  async search(query: string, params?: Omit<KeywordListParams, 'search'>): Promise<KeywordListData> {
    // apiClient.get 已经通过 unwrapApiResponse 自动解包了 data 字段
    return apiClient.get<KeywordListData>(
      KEYWORD.SEARCH,
      { ...params, search: query }
    );
  }

  /**
   * 解锁关键词（消耗 1 个 credit）
   * @param id - 关键词 ID
   * @returns 解锁响应
   */
  async unlock(id: number): Promise<UnlockKeywordResponse> {
    return apiClient.post<UnlockKeywordResponse>(KEYWORD.UNLOCK(id), {});
  }
}

/**
 * 导出单例实例
 */
export const keywordService = new KeywordService();

/**
 * 导出类型供其他模块使用
 */
export type { KeywordService };
