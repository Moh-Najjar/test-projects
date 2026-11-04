import { ControlKeys } from '../../../../core/enums/control-keys.enum';
import type { ControlType, DataType } from '../../../../core/types/admin/adminLookups';

/** UI / validation rules for each admin form control type. */
export interface ControlFieldRequirements {
  controlKey: string;
  /** Short admin hint shown when this control is selected. */
  hint: string;
  requiresLookup: boolean;
  requiresCalculation: boolean;
  requiresTableColumns: boolean;
  requiresTableRows: boolean;
  supportsRawTableRowLabels: boolean;
  showValidationSection: boolean;
  showNumericValidation: boolean;
  showLengthValidation: boolean;
  showRegexValidation: boolean;
  /** When false, the validation-message EN/AR fields are hidden. */
  showValidationMessages: boolean;
  showContentHelpSection: boolean;
  showPlaceholder: boolean;
  /** Help text EN/AR shown inside the Validation section (used by table controls). */
  showHelpTextInValidation: boolean;
  showKpiField: boolean;
  showAdvancedSection: boolean;
  forceReadOnly: boolean;
  forceOptional: boolean;
  lockDataType: boolean;
  suggestedDataTypeKey: string | null;
}

const baseRequirements = (
  controlKey: string,
  overrides: Partial<ControlFieldRequirements>,
): ControlFieldRequirements => ({
  controlKey,
  hint: 'admin.forms.hint.default',
  requiresLookup: false,
  requiresCalculation: false,
  requiresTableColumns: false,
  requiresTableRows: false,
  supportsRawTableRowLabels: false,
  showValidationSection: true,
  showNumericValidation: false,
  showLengthValidation: true,
  showRegexValidation: true,
  showValidationMessages: true,
  showContentHelpSection: true,
  showPlaceholder: true,
  showHelpTextInValidation: false,
  showKpiField: true,
  showAdvancedSection: true,
  forceReadOnly: false,
  forceOptional: false,
  lockDataType: false,
  suggestedDataTypeKey: null,
  ...overrides,
});

/** Requirement map keyed by controlKey from the lookups API. */
export const CONTROL_FIELD_REQUIREMENTS: Record<string, ControlFieldRequirements> = {
  [ControlKeys.Text]: baseRequirements(ControlKeys.Text, {
    hint: 'admin.forms.hint.text',
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.Number]: baseRequirements(ControlKeys.Number, {
    hint: 'admin.forms.hint.number',
    showNumericValidation: true,
    showLengthValidation: false,
    showRegexValidation: true,
    suggestedDataTypeKey: 'NUMBER',
  }),
  [ControlKeys.Textarea]: baseRequirements(ControlKeys.Textarea, {
    hint: 'admin.forms.hint.textarea',
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.Datepicker]: baseRequirements(ControlKeys.Datepicker, {
    hint: 'admin.forms.hint.datepicker',
    showLengthValidation: false,
    showRegexValidation: false,
    suggestedDataTypeKey: 'DATE',
  }),
  [ControlKeys.Dropdown]: baseRequirements(ControlKeys.Dropdown, {
    hint: 'admin.forms.hint.dropdown',
    requiresLookup: true,
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.Checkbox]: baseRequirements(ControlKeys.Checkbox, {
    hint: 'admin.forms.hint.checkbox',
    showValidationSection: false,
    showPlaceholder: false,
    forceOptional: true,
    suggestedDataTypeKey: 'BOOLEAN',
  }),
  [ControlKeys.Radio]: baseRequirements(ControlKeys.Radio, {
    hint: 'admin.forms.hint.radio',
    requiresLookup: true,
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.FileUpload]: baseRequirements(ControlKeys.FileUpload, {
    hint: 'admin.forms.hint.fileUpload',
    showValidationSection: false,
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.Multiselect]: baseRequirements(ControlKeys.Multiselect, {
    hint: 'admin.forms.hint.multiselect',
    requiresLookup: true,
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.Table]: baseRequirements(ControlKeys.Table, {
    hint: 'admin.forms.hint.table',
    requiresTableColumns: true,
    showValidationSection: true,
    showLengthValidation: false,
    showRegexValidation: false,
    showValidationMessages: false,
    showContentHelpSection: false,
    showPlaceholder: false,
    showHelpTextInValidation: true,
    showAdvancedSection: false,
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.Percentage]: baseRequirements(ControlKeys.Percentage, {
    hint: 'admin.forms.hint.percentage',
    showNumericValidation: true,
    showLengthValidation: false,
    showRegexValidation: true,
    suggestedDataTypeKey: 'NUMBER',
  }),
  [ControlKeys.RawTable]: baseRequirements(ControlKeys.RawTable, {
    hint: 'admin.forms.hint.rawTable',
    requiresTableColumns: true,
    requiresTableRows: true,
    supportsRawTableRowLabels: true,
    showValidationSection: true,
    showLengthValidation: false,
    showRegexValidation: false,
    showValidationMessages: false,
    showContentHelpSection: false,
    showPlaceholder: false,
    showHelpTextInValidation: true,
    showAdvancedSection: false,
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.Label]: baseRequirements(ControlKeys.Label, {
    hint: 'admin.forms.hint.label',
    showValidationSection: false,
    showKpiField: false,
    showAdvancedSection: false,
    forceReadOnly: true,
    forceOptional: true,
    suggestedDataTypeKey: 'TEXT',
  }),
  [ControlKeys.CalculatedField]: baseRequirements(ControlKeys.CalculatedField, {
    hint: 'admin.forms.hint.calculated',
    requiresCalculation: true,
    showValidationSection: false,
    showContentHelpSection: false,
    showAdvancedSection: false,
    forceReadOnly: true,
    lockDataType: true,
    suggestedDataTypeKey: 'NUMBER',
  }),
};

export const resolveControlType = (
  controlTypeId: number,
  controlTypes: ControlType[],
): ControlType | undefined =>
  controlTypes.find((controlType) => controlType.controlTypeId === controlTypeId);

export const getControlRequirements = (
  controlTypeId: number | '',
  controlTypes: ControlType[],
): ControlFieldRequirements | null => {
  if (controlTypeId === '') {
    return null;
  }
  const controlType = resolveControlType(controlTypeId, controlTypes);
  if (controlType === undefined) {
    return null;
  }
  return CONTROL_FIELD_REQUIREMENTS[controlType.controlKey] ?? null;
};

export const resolveSuggestedDataTypeId = (
  requirements: ControlFieldRequirements | null,
  dataTypes: DataType[],
): number | '' => {
  if (requirements === null || requirements.suggestedDataTypeKey === null) {
    return '';
  }
  const match = dataTypes.find((dataType) => dataType.typeKey === requirements.suggestedDataTypeKey);
  return match?.dataTypeId ?? '';
};

export const formatControlTypeLabel = (
  controlTypeId: number,
  controlTypes: ControlType[],
): string => {
  const controlType = resolveControlType(controlTypeId, controlTypes);
  if (controlType === undefined) {
    return `Control #${controlTypeId}`;
  }
  return `${controlType.controlName} (#${controlTypeId})`;
};

export const isLookupRequired = (
  controlTypeId: number | '',
  controlTypes: ControlType[],
): boolean => {
  const requirements = getControlRequirements(controlTypeId, controlTypes);
  return requirements?.requiresLookup ?? false;
};

export const isCalculatedControlType = (
  controlTypeId: number | '',
  controlTypes: ControlType[],
): boolean => {
  const requirements = getControlRequirements(controlTypeId, controlTypes);
  return requirements?.requiresCalculation ?? false;
};
