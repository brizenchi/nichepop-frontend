/**
 * LocalStorage 键名管理
 * 使用应用名称作为前缀，避免与其他应用冲突
 */

// 生成带前缀的键名。前缀和以前一样（未设置 NEXT_PUBLIC_APP_NAME 时为 MyApp），已保存的数据不会丢。
const createStorageKey = (key: string): string => {
  const prefix = (process.env.NEXT_PUBLIC_APP_NAME || 'MyApp').toLowerCase().replace(/\s+/g, '_');
  return `${prefix}_${key}`;
};

/**
 * 旧版登录（frontend#6 之前）存的 token 和用户信息，现在只用来清理
 */
export const LEGACY_TOKEN_KEY = createStorageKey('token');
export const LEGACY_USER_KEY = createStorageKey('user');

/**
 * 其他存储键可以在这里添加
 * 例如：
 * export const THEME_KEY = createStorageKey('theme');
 * export const LANGUAGE_KEY = createStorageKey('language');
 */

/**
 * Radar（机会雷达）相关的存储键
 */
export const RADAR_WATCHLIST_KEY = createStorageKey('radar_watchlist');
export const RADAR_VIEWS_KEY = createStorageKey('radar_views');
export const RADAR_MONITORS_KEY = createStorageKey('radar_monitors');
export const ONBOARDING_KEY = createStorageKey('onboarding');
export const ONBOARDING_DRAFT_KEY = createStorageKey('onboarding_draft');
export const CHAT_KEY = createStorageKey('chat');
