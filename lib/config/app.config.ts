/**
 * 应用配置系统
 * 集中管理所有应用级别的配置，包括认证、支付、品牌等
 */

import { env } from '../env';

/**
 * 认证提供者类型
 */
export type AuthProvider = 'google' | 'email' | 'github';

/**
 * 认证配置
 */
export interface AuthConfig {
  /**
   * 启用的认证提供者
   */
  providers: AuthProvider[];

  /**
   * 认证回调 URL
   * 默认为 ${APP_URL}/auth/callback
   */
  callbackUrl: string;

  /**
   * 登录对话框配置
   */
  loginDialog: {
    title: string;
    subtitle: string;
    features: Array<{
      icon: string;
      text: string;
    }>;
  };
}

/**
 * 支付计划配置
 */
export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  popular?: boolean;
  features: Array<{
    text: string;
    included: boolean;
  }>;
  stripePriceId?: string;
  stripeLink?: string;
  cta: string;
  disabled?: boolean;
}

/**
 * 支付配置
 */
export interface PaymentConfig {
  /**
   * 支付提供者 (stripe, paypal 等)
   */
  provider: 'stripe' | 'paypal' | 'custom';

  /**
   * Stripe 公钥 (如果使用 Stripe)
   */
  stripePublishableKey?: string;

  /**
   * 定价计划
   */
  plans: PricingPlan[];
}

/**
 * 品牌配置
 */
export interface BrandConfig {
  /**
   * 应用名称
   */
  name: string;

  /**
   * 应用描述
   */
  description?: string;

  /**
   * 应用 URL
   */
  url?: string;

  /**
   * Logo 路径
   */
  logo?: string;

  /**
   * Favicon 路径
   */
  favicon?: string;
}

/**
 * 应用配置类型
 */
export interface AppConfig {
  brand: BrandConfig;
  auth: AuthConfig;
  payment: PaymentConfig;
}

/**
 * 默认应用配置
 * 可以通过修改此文件来定制应用
 */
export const appConfig: AppConfig = {
  // 品牌配置
  brand: {
    name: env.NEXT_PUBLIC_APP_NAME,
    description: env.NEXT_PUBLIC_APP_DESCRIPTION,
    url: env.NEXT_PUBLIC_APP_URL,
    logo: '/placeholder-logo.svg',
    favicon: '/icon.svg',
  },

  // 认证配置
  auth: {
    providers: [
      ...(env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH ? ['google' as AuthProvider] : []),
      ...(env.NEXT_PUBLIC_ENABLE_EMAIL_AUTH ? ['email' as AuthProvider] : []),
      ...(env.NEXT_PUBLIC_ENABLE_GITHUB_AUTH ? ['github' as AuthProvider] : []),
    ],
    callbackUrl: env.NEXT_PUBLIC_AUTH_REDIRECT_URL || `${env.NEXT_PUBLIC_APP_URL || ''}/auth/callback`,
    loginDialog: {
      title: `Welcome to ${env.NEXT_PUBLIC_APP_NAME}!`,
      subtitle: 'Sign in to save your dashboard, unlock validation reports, and continue customer follow-up',
      features: [
        {
          icon: '📌',
          text: 'Save marketing dashboards',
        },
        {
          icon: '📊',
          text: 'Unlock validation reports',
        },
        {
          icon: '🔔',
          text: 'Access continuous follow-up workflows',
        },
      ],
    },
  },

  // 支付配置
  payment: {
    provider: 'stripe',
    stripePublishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: '$0',
        description: 'Best for trying one marketing dashboard before you pay',
        features: [
          { text: 'Browse the free Idea Browser', included: true },
          { text: 'Run a first marketing dashboard preview', included: true },
          { text: 'Review sample posts and source links', included: true },
          { text: 'Full validation reports', included: false },
          { text: 'Complete lead lists', included: false },
          { text: 'Continuous follow-up workflows', included: false },
        ],
        cta: 'Current Plan',
      },
      {
        id: 'pro-monthly',
        name: 'Validation',
        price: '$19',
        period: '/month',
        description: 'For founders validating whether one specific idea is worth building',
        popular: true,
        stripePriceId: env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
        stripeLink: env.NEXT_PUBLIC_STRIPE_LINK_PRO_MONTHLY,
        features: [
          { text: 'Everything in Free', included: true },
          { text: 'Idea validation reports', included: true },
          { text: 'Score breakdowns and analysis', included: true },
          { text: 'Pain point evidence with links', included: true },
          { text: 'Competitor snapshots', included: true },
          { text: 'Continuous follow-up workflows', included: false },
        ],
        cta: 'Upgrade to Validation',
      },
      {
        id: 'pro-yearly',
        name: 'Validation',
        price: '$190',
        period: '/year',
        description: 'Validation plan billed yearly',
        stripePriceId: env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY,
        stripeLink: env.NEXT_PUBLIC_STRIPE_LINK_PRO_YEARLY,
        features: [
          { text: 'Everything in Free', included: true },
          { text: 'Idea validation reports', included: true },
          { text: 'Score breakdowns and analysis', included: true },
          { text: 'Pain point evidence with links', included: true },
          { text: 'Competitor snapshots', included: true },
          { text: 'Continuous follow-up workflows', included: false },
        ],
        cta: 'Upgrade to Validation Yearly',
      },
      {
        id: 'premium-monthly',
        name: 'Monitor',
        price: '$49',
        period: '/month',
        description: 'For teams that want ongoing customer discovery and marketing follow-up',
        stripePriceId: env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY,
        stripeLink: env.NEXT_PUBLIC_STRIPE_LINK_PREMIUM_MONTHLY,
        features: [
          { text: 'Everything in Validation', included: true },
          { text: 'Realtime discussion alerts', included: true },
          { text: 'Daily digest delivery', included: true },
          { text: 'Complete target customer lists', included: true },
          { text: 'Competitor and complaint tracking', included: true },
          { text: 'Continuous follow-up workflows', included: true },
        ],
        cta: 'Upgrade to Monitor',
      },
      {
        id: 'premium-yearly',
        name: 'Monitor',
        price: '$490',
        period: '/year',
        description: 'Monitor plan billed yearly',
        stripePriceId: env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_YEARLY,
        stripeLink: env.NEXT_PUBLIC_STRIPE_LINK_PREMIUM_YEARLY,
        features: [
          { text: 'Everything in Validation', included: true },
          { text: 'Realtime discussion alerts', included: true },
          { text: 'Daily digest delivery', included: true },
          { text: 'Complete target customer lists', included: true },
          { text: 'Competitor and complaint tracking', included: true },
          { text: 'Continuous follow-up workflows', included: true },
        ],
        cta: 'Upgrade to Monitor Yearly',
      },
    ],
  },
};

/**
 * 辅助函数：获取品牌配置
 */
export function getBrandConfig(): BrandConfig {
  return appConfig.brand;
}

/**
 * 辅助函数：获取认证配置
 */
export function getAuthConfig(): AuthConfig {
  return appConfig.auth;
}

/**
 * 辅助函数：获取支付配置
 */
export function getPaymentConfig(): PaymentConfig {
  return appConfig.payment;
}

/**
 * 辅助函数：检查某个认证提供者是否启用
 */
export function isAuthProviderEnabled(provider: AuthProvider): boolean {
  return appConfig.auth.providers.includes(provider);
}

/**
 * 辅助函数：获取所有启用的认证提供者
 */
export function getEnabledAuthProviders(): AuthProvider[] {
  return appConfig.auth.providers;
}

/**
 * 辅助函数：获取定价计划
 */
export function getPricingPlans(): PricingPlan[] {
  return appConfig.payment.plans;
}

/**
 * 辅助函数：根据 ID 获取定价计划
 */
export function getPricingPlanById(id: string): PricingPlan | undefined {
  return appConfig.payment.plans.find((plan) => plan.id === id);
}
