import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { listUsersApi } from '../../../core/api/admin/adminUsers';
import { getFormByIdApi } from '../../../core/api/admin/adminForms';
import { useAdminForms } from '../../../core/hooks/admin/useAdminForms';
import { useLocale } from '../../../core/hooks/useLocale';
import type { AdminForm, AdminFormField } from '../../../core/types/admin/adminForms';
import type { AdminUser } from '../../../core/types/admin/adminUsers';
import type { SubmissionAuditLog } from '../../../core/types/submissionAuditLog';
import { storedFieldKeys } from './diffAuditValues';
import { EM_DASH } from './presentation';

/** One choice in the form or user filter. `id` is what the audit API expects. */
export interface LookupOption {
  id: string;
  label: string;
}

/** Labels needed to describe one audit event against its form. */
export interface AuditLogLabels {
  formName: string;
  fieldLabel: (fieldKey: string) => string;
  columnLabel: (fieldKey: string, columnKey: string) => string;
}

export const EMPTY_AUDIT_LABELS: AuditLogLabels = {
  formName: '',
  fieldLabel: (fieldKey) => fieldKey,
  columnLabel: (_fieldKey, columnKey) => columnKey,
};

interface CatalogField {
  fieldKey: string;
  fieldLabel: string;
  formId: number;
  formName: string;
  columns: ReadonlyMap<string, string>;
}

const USER_PAGE_SIZE = 100;
const MAX_USER_PAGES = 20;

const userLabel = (
  user: AdminUser,
  loc: (en: string | null | undefined, ar: string | null | undefined) => string,
): string => {
  const name = loc(user.fullNameEn, user.fullNameAr);
  if (name.length > 0) return name;
  if (user.username.trim().length > 0) return user.username;
  return `#${String(user.userId)}`;
};

/** Every admin user, walked page by page so the name list is complete. */
const useAuditUsers = () =>
  useQuery({
    queryKey: ['audit-log-users'],
    staleTime: 60_000,
    queryFn: async (): Promise<AdminUser[]> => {
      const first = await listUsersApi({ page: 1, pageSize: USER_PAGE_SIZE });
      const users = [...first.items];
      const lastPage = Math.min(first.totalPages, MAX_USER_PAGES);

      for (let page = 2; page <= lastPage; page += 1) {
        const next = await listUsersApi({ page, pageSize: USER_PAGE_SIZE });
        users.push(...next.items);
      }

      return users;
    },
  });

const findLabel = (options: readonly LookupOption[], id: string): string => {
  const match = options.find((option) => option.id === id);
  return match !== undefined ? match.label : `#${id}`;
};

const toCatalogField = (
  form: AdminForm,
  field: AdminFormField,
  loc: (en: string | null | undefined, ar: string | null | undefined) => string,
): CatalogField => {
  const columns = new Map<string, string>();
  for (const column of field.formFieldColumns) {
    const label = loc(column.labelEn, column.labelAr);
    columns.set(column.columnKey, label.length > 0 ? label : column.columnKey);
  }
  const fieldLabel = loc(field.labelEn, field.labelAr);
  return {
    fieldKey: field.fieldKey,
    fieldLabel: fieldLabel.length > 0 ? fieldLabel : field.fieldKey,
    formId: form.formId,
    formName: loc(form.nameEn, form.nameAr),
    columns,
  };
};

const scoreFormId = (keys: readonly string[], index: ReadonlyMap<string, CatalogField[]>): number | null => {
  const scores = new Map<number, number>();
  for (const key of keys) {
    const matches = index.get(key) ?? [];
    for (const match of matches) {
      scores.set(match.formId, (scores.get(match.formId) ?? 0) + 1);
    }
  }

  let bestId: number | null = null;
  let bestScore = 0;
  for (const [formId, score] of scores) {
    if (score > bestScore) {
      bestId = formId;
      bestScore = score;
    }
  }
  return bestId;
};

/**
 * Form names, user names, and field labels for filters, charts, the table, and the log dialog.
 */
export const useAuditLookups = () => {
  const { loc } = useLocale();
  const formsQuery = useAdminForms();
  const usersQuery = useAuditUsers();
  const formList = Array.isArray(formsQuery.data) ? formsQuery.data : [];
  const formIds = formList.map((form) => form.formId);

  const catalogQuery = useQuery({
    queryKey: ['audit-log-form-catalog', formIds],
    enabled: formsQuery.isSuccess,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AdminForm[]> =>
      Promise.all(
        formList.map(async (form) => {
          try {
            return await getFormByIdApi(form.formId);
          } catch {
            return form;
          }
        }),
      ),
  });

  const forms = useMemo<LookupOption[]>(() => {
    return formList
      .map((form) => ({
        id: String(form.formId),
        label: loc(form.nameEn, form.nameAr),
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [formList, loc]);

  const users = useMemo<LookupOption[]>(() => {
    const list = usersQuery.data ?? [];
    return list
      .map((user) => ({
        id: String(user.userId),
        label: userLabel(user, loc),
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [usersQuery.data, loc]);

  const catalog = useMemo(() => {
    const details = catalogQuery.data ?? formList;
    const index = new Map<string, CatalogField[]>();
    const byForm = new Map<number, Map<string, CatalogField>>();

    for (const form of details) {
      const fields = Array.isArray(form.formFields) ? form.formFields : [];
      const formFields = new Map<string, CatalogField>();
      for (const field of fields) {
        const entry = toCatalogField(form, field, loc);
        formFields.set(entry.fieldKey, entry);
        const bucket = index.get(entry.fieldKey) ?? [];
        bucket.push(entry);
        index.set(entry.fieldKey, bucket);
      }
      byForm.set(form.formId, formFields);
    }

    return { index, byForm };
  }, [catalogQuery.data, formList, loc]);

  const formName = (id: string): string => findLabel(forms, id);

  const userName = (id: number | string): string => findLabel(users, String(id));

  const describeLog = (log: SubmissionAuditLog): AuditLogLabels => {
    const keys = storedFieldKeys(log.oldValue, log.newValue);
    const explicitFormId = log.formId;
    const formId =
      typeof explicitFormId === 'number' && explicitFormId > 0
        ? explicitFormId
        : scoreFormId(keys, catalog.index);
    const formFields = formId === null ? undefined : catalog.byForm.get(formId);
    const resolvedName = formId === null ? '' : formName(String(formId));

    return {
      formName: resolvedName.length > 0 ? resolvedName : EM_DASH,
      fieldLabel: (fieldKey: string): string => {
        const match = formFields?.get(fieldKey);
        return match !== undefined ? match.fieldLabel : fieldKey;
      },
      columnLabel: (fieldKey: string, columnKey: string): string => {
        const match = formFields?.get(fieldKey)?.columns.get(columnKey);
        return match !== undefined && match.length > 0 ? match : columnKey;
      },
    };
  };

  return {
    forms,
    users,
    formName,
    userName,
    describeLog,
    formsLoading: formsQuery.isLoading,
    usersLoading: usersQuery.isLoading,
  };
};
