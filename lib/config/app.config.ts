/**
 * Brand details for the error pages. Sign-in and payment settings come from
 * the API now (GET /capabilities, the template's lib/env.ts).
 */

import { appEnv } from '../env';

export interface BrandConfig {
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  favicon?: string;
}

const brand: BrandConfig = {
  name: appEnv.appName,
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  url: appEnv.appUrl,
  logo: '/placeholder-logo.svg',
  favicon: '/icon.svg',
};

export function getBrandConfig(): BrandConfig {
  return brand;
}
