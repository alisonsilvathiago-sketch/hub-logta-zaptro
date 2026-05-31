import type { LogstokaBannerData } from '@/components/layout/LogstokaGlobalNotificationBanner';

/**
 * Dispatches a custom event to display the global clickable top notification banner.
 */
export function showLogstokaBanner(data: LogstokaBannerData) {
  window.dispatchEvent(new CustomEvent('logstoka:show-banner', { detail: data }));
}
