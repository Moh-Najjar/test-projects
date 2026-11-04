import type { TFunction } from 'i18next';
import type { UserRole } from '../../../core/types/roles';

export interface NavbarNavItem {
  id: string;
  label: string;
  to: string;
  children?: ReadonlyArray<NavbarNavItem>;
  /**
   * Whitelist of roles allowed to see this item.
   * - `undefined`  → visible to every authenticated user.
   * - `[]`         → hidden from everyone (use to temporarily disable).
   * - `['APPROVER']` → visible only to users holding at least one listed role.
   */
  allowedRoles?: ReadonlyArray<UserRole>;
}

export interface CreateNavLinksOptions {
  /** If provided, replaces the default Ramadan campaign route with a live URL from the API. */
  ramadanCampaignUrl?: string;
}

export function createNavLinks(t: TFunction, options?: CreateNavLinksOptions): ReadonlyArray<NavbarNavItem> {
  // const ramadanCampaignTo = options?.ramadanCampaignUrl ? options.ramadanCampaignUrl : '/ramadanCampaign2026';

  const items: ReadonlyArray<NavbarNavItem> = [
    {
      id: 'home',
      label: t('nav.home'),
      to: '/home',
    },
    {
      id: 'my-requests',
      label: t('nav.my-requests'),
      to: '/my-requests',
    },
    {
      id: 'user-guide',
      label: t('nav.userGuide'),
      to: '/user-guide',
    },
  ];
  return items;
}
