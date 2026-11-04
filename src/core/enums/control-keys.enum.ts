/** Control key identifiers that match the controlType.controlKey values in formData-v1.json */
export const ControlKeys = {
  Text: 'TEXT',
  Number: 'NUMBER',
  Textarea: 'TEXTAREA',
  Datepicker: 'DATEPICKER',
  Dropdown: 'DROPDOWN',
  Checkbox: 'CHECKBOX',
  Radio: 'RADIO',
  FileUpload: 'FILEUPLOAD',
  Multiselect: 'MULTISELECT',
  Table: 'TABLE',
  Percentage: 'PERCENTAGE',
  RawTable: 'RAW_TABLE',
  Label: 'LABEL',
  CalculatedField: 'CALCULATED_FIELD',
} as const;

/** Union type derived from the ControlKeys object values */
export type ControlKeys = (typeof ControlKeys)[keyof typeof ControlKeys];
