import { ControlKeys } from '../../../../core/enums/control-keys.enum';
import type { SetCalculationRequest } from '../../../../core/types/admin/adminForms';
import type { ControlType, DataType } from '../../../../core/types/admin/adminLookups';

export interface CalculationInputDraft {
  clientId: string;
  inputToken: string;
  columnKey: string;
  labelEn: string;
  labelAr: string;
  dataTypeId: number | '';
  controlTypeId: number | '';
  isRequired: boolean;
}

export interface CalculationConfigDraft {
  formulaExpression: string;
  resultColumnKey: string;
  resultLabelEn: string;
  resultLabelAr: string;
  resultPrecision: string;
  resultDataTypeId: number | '';
  resultControlTypeId: number | '';
  buttonLabelEn: string;
  buttonLabelAr: string;
  displayFormulaEn: string;
  displayFormulaAr: string;
  helpTextEn: string;
  helpTextAr: string;
  inputs: CalculationInputDraft[];
}

const resolveDefaultNumberDataTypeId = (dataTypes: DataType[]): number | '' => {
  const numberType = dataTypes.find((dataType) => dataType.typeKey === 'NUMBER');
  if (numberType !== undefined) {
    return numberType.dataTypeId;
  }
  return dataTypes[0]?.dataTypeId ?? '';
};

const resolveDefaultNumberControlTypeId = (controlTypes: ControlType[]): number | '' => {
  const numberControl = controlTypes.find((controlType) => controlType.controlKey === ControlKeys.Number);
  if (numberControl !== undefined) {
    return numberControl.controlTypeId;
  }
  const textControl = controlTypes.find((controlType) => controlType.controlKey === ControlKeys.Text);
  if (textControl !== undefined) {
    return textControl.controlTypeId;
  }
  return controlTypes[0]?.controlTypeId ?? '';
};

export const createCalculationInputDraft = (
  inputToken: string,
  columnKey: string,
  labelEn: string,
  labelAr: string,
  dataTypeId: number | '',
  controlTypeId: number | '',
  clientId: string,
): CalculationInputDraft => ({
  clientId,
  inputToken,
  columnKey,
  labelEn,
  labelAr,
  dataTypeId,
  controlTypeId,
  isRequired: true,
});

export const createDefaultCalculationConfig = (
  dataTypes: DataType[],
  controlTypes: ControlType[],
): CalculationConfigDraft => {
  const defaultDataTypeId = resolveDefaultNumberDataTypeId(dataTypes);
  const defaultControlTypeId = resolveDefaultNumberControlTypeId(controlTypes);

  return {
    formulaExpression: 'A / B',
    resultColumnKey: 'RESULT',
    resultLabelEn: 'Result',
    resultLabelAr: 'النتيجة',
    resultPrecision: '2',
    resultDataTypeId: defaultDataTypeId,
    resultControlTypeId: defaultControlTypeId,
    buttonLabelEn: 'Calculate',
    buttonLabelAr: 'احسب',
    displayFormulaEn: '',
    displayFormulaAr: '',
    helpTextEn: '',
    helpTextAr: '',
    inputs: [
      createCalculationInputDraft('A', 'VALUE_A', 'Value A', 'القيمة أ', defaultDataTypeId, defaultControlTypeId, 'input-a'),
      createCalculationInputDraft('B', 'VALUE_B', 'Value B', 'القيمة ب', defaultDataTypeId, defaultControlTypeId, 'input-b'),
    ],
  };
};

const parseOptionalString = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const validateCalculationConfig = (
  config: CalculationConfigDraft,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (config.formulaExpression.trim().length === 0) {
    errors.formulaExpression = 'admin.common.required';
  }
  if (config.resultColumnKey.trim().length === 0) {
    errors.resultColumnKey = 'admin.common.required';
  }
  if (config.resultLabelEn.trim().length === 0) {
    errors.resultLabelEn = 'admin.common.required';
  }
  if (config.resultLabelAr.trim().length === 0) {
    errors.resultLabelAr = 'admin.common.required';
  }
  if (config.buttonLabelEn.trim().length === 0) {
    errors.buttonLabelEn = 'admin.common.required';
  }
  if (config.buttonLabelAr.trim().length === 0) {
    errors.buttonLabelAr = 'admin.common.required';
  }
  if (config.resultDataTypeId === '') {
    errors.resultDataTypeId = 'admin.common.required';
  }
  if (config.resultControlTypeId === '') {
    errors.resultControlTypeId = 'admin.common.required';
  }

  const precisionTrimmed = config.resultPrecision.trim();
  if (precisionTrimmed.length === 0) {
    errors.resultPrecision = 'admin.common.required';
  } else {
    const parsedPrecision = Number(precisionTrimmed);
    if (Number.isNaN(parsedPrecision) || parsedPrecision < 0) {
      errors.resultPrecision = 'admin.forms.calc.precisionMin';
    }
  }

  if (config.inputs.length === 0) {
    errors.calculationInputs = 'admin.forms.calc.inputsRequired';
  }

  config.inputs.forEach((input, index) => {
    const prefix = `calculationInputs.${index}`;
    if (input.inputToken.trim().length === 0) {
      errors[`${prefix}.inputToken`] = 'admin.common.required';
    }
    if (input.columnKey.trim().length === 0) {
      errors[`${prefix}.columnKey`] = 'admin.common.required';
    }
    if (input.labelEn.trim().length === 0) {
      errors[`${prefix}.labelEn`] = 'admin.common.required';
    }
    if (input.labelAr.trim().length === 0) {
      errors[`${prefix}.labelAr`] = 'admin.common.required';
    }
    if (input.dataTypeId === '') {
      errors[`${prefix}.dataTypeId`] = 'admin.common.required';
    }
    if (input.controlTypeId === '') {
      errors[`${prefix}.controlTypeId`] = 'admin.common.required';
    }
  });

  return errors;
};

export const buildSetCalculationRequest = (
  config: CalculationConfigDraft,
): SetCalculationRequest => {
  const request: SetCalculationRequest = {
    formulaExpression: config.formulaExpression.trim(),
    resultColumnKey: config.resultColumnKey.trim().toUpperCase(),
    resultLabelEn: config.resultLabelEn.trim(),
    resultLabelAr: config.resultLabelAr.trim(),
    resultPrecision: Number(config.resultPrecision.trim()),
    resultDataTypeId: Number(config.resultDataTypeId),
    resultControlTypeId: Number(config.resultControlTypeId),
    buttonLabelEn: config.buttonLabelEn.trim(),
    buttonLabelAr: config.buttonLabelAr.trim(),
    inputs: config.inputs.map((input, index) => ({
      inputToken: input.inputToken.trim().toUpperCase(),
      columnKey: input.columnKey.trim().toUpperCase(),
      labelEn: input.labelEn.trim(),
      labelAr: input.labelAr.trim(),
      dataTypeId: Number(input.dataTypeId),
      controlTypeId: Number(input.controlTypeId),
      displayOrder: index + 1,
      isRequired: input.isRequired,
      isVisible: true,
    })),
  };

  const parsedDisplayFormulaEn = parseOptionalString(config.displayFormulaEn);
  if (parsedDisplayFormulaEn !== undefined) {
    request.displayFormulaEn = parsedDisplayFormulaEn;
  }
  const parsedDisplayFormulaAr = parseOptionalString(config.displayFormulaAr);
  if (parsedDisplayFormulaAr !== undefined) {
    request.displayFormulaAr = parsedDisplayFormulaAr;
  }
  const parsedHelpTextEn = parseOptionalString(config.helpTextEn);
  if (parsedHelpTextEn !== undefined) {
    request.helpTextEn = parsedHelpTextEn;
  }
  const parsedHelpTextAr = parseOptionalString(config.helpTextAr);
  if (parsedHelpTextAr !== undefined) {
    request.helpTextAr = parsedHelpTextAr;
  }

  return request;
};
