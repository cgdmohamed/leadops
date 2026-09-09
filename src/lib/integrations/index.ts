import type { PlatformClient } from './types';
import { MetaClient } from './meta';
import { GoogleAdsClient } from './google';
import { TikTokClient } from './tiktok';
import { SnapchatClient } from './snapchat';

export const platformClients: Record<string, PlatformClient> = {
  meta: new MetaClient(),
  google: new GoogleAdsClient(),
  tiktok: new TikTokClient(),
  snapchat: new SnapchatClient(),
};

export function getClient(platform: string): PlatformClient | null {
  return platformClients[platform] ?? null;
}