import { useMediaQuery } from '@mui/material';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface UseDeviceTypeOptions {
  /** Maximum width (inclusive) in px for mobile devices. Default: 767px */
  mobileMaxWidthPx?: number;
  /** Maximum width (inclusive) in px for tablet devices. Default: 1023px */
  tabletMaxWidthPx?: number;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Returns the current device type based on real CSS media query breakpoints:
 * - mobile:  0px  – mobileMaxWidthPx   (default ≤ 767px)
 * - tablet:  mobileMaxWidthPx+1 – tabletMaxWidthPx  (default 768px – 1023px)
 * - desktop: tabletMaxWidthPx+1 and above            (default ≥ 1024px)
 */
export function useDeviceType(options?: UseDeviceTypeOptions): DeviceType {
  const mobileMaxWidthPx = isFiniteNonNegativeNumber(options?.mobileMaxWidthPx)
    ? options.mobileMaxWidthPx
    : 767;

  const tabletMaxWidthPx = isFiniteNonNegativeNumber(options?.tabletMaxWidthPx)
    ? options.tabletMaxWidthPx
    : 1023;

  // Matches screens up to and including the mobile max width
  const isMobile = useMediaQuery(`@media (max-width: ${mobileMaxWidthPx}px)`);

  // Matches screens between mobile max+1 and tablet max
  const isTablet = useMediaQuery(
    `@media (min-width: ${mobileMaxWidthPx + 1}px) and (max-width: ${tabletMaxWidthPx}px)`,
  );

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}
