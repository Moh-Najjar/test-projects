import { useMemo } from 'react';
import type { NavbarNavItem } from './navLinks';
import type { UserRole } from '../../../core/types/roles';

/**
 * Recursively filters a nav tree by the current user's roles.
 *
 * Filtering rules per item:
 *   - `allowedRoles` is `undefined`  → always included (no restriction).
 *   - `allowedRoles` is `[]`          → always excluded (explicitly disabled).
 *   - `allowedRoles` has entries:
 *       - If `userRoles` is not yet resolved → excluded (safe default).
 *       - If `userRoles` contains at least one matching role → included.
 *
 * Children are filtered recursively so deeply-nested items are also
 * subject to RBAC without any extra wiring in the parent component.
 */
function filterItems(
  items: ReadonlyArray<NavbarNavItem>,
  userRoles: ReadonlyArray<UserRole> | undefined
): ReadonlyArray<NavbarNavItem> {
  return items
    .filter((item): boolean => {
      // No restriction → always visible to authenticated users.
      if (item.allowedRoles === undefined) return true;

      // Explicitly disabled (empty whitelist).
      if (item.allowedRoles.length === 0) return false;

      // Roles not yet resolved → show only unrestricted items (safe default).
      if (userRoles === undefined || userRoles.length === 0) return false;

      // Include when the user holds at least one of the required roles.
      return item.allowedRoles.some((role) => userRoles.includes(role));
    })
    .map((item): NavbarNavItem => {
      // Recursively filter children when they exist.
      if (item.children === undefined || item.children.length === 0) {
        return item;
      }
      return { ...item, children: filterItems(item.children, userRoles) };
    });
}

/**
 * Returns the RBAC-filtered subset of the nav tree the current user is
 * permitted to see.
 *
 * Usage (no RBAC restrictions yet — all public items pass through):
 *   const visibleItems = useNavItems(allItems);
 *
 * Usage once RBAC is fully wired:
 *   const { userRoles } = useAuth();
 *   const visibleItems = useNavItems(allItems, userRoles as UserRole[]);
 *
 * @param items     - Full nav tree produced by `createNavLinks`.
 * @param userRoles - Roles of the authenticated user; pass `undefined` until RBAC is active.
 */
export function useNavItems(
  items: ReadonlyArray<NavbarNavItem>,
  userRoles?: ReadonlyArray<UserRole>
): ReadonlyArray<NavbarNavItem> {
  return useMemo<ReadonlyArray<NavbarNavItem>>(
    () => filterItems(items, userRoles),
    [items, userRoles]
  );
}
