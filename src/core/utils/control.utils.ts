import MultiSelect from "../../modules/controls/MultiSelect";
import InputField from "../../modules/controls/InputField";
import PercentageField from "../../modules/controls/PercentageField";
import TableGrid from "../../modules/controls/TableGrid";
import DropDown from "../../modules/controls/DropDown";
import DatePicker from "../../modules/controls/Date";
import RawTable from "../../modules/controls/RawTable";
import Label from "../../modules/controls/Label";
import CalculatedField from "../../modules/controls/CalculatedField";

import { ControlKeys } from "../enums/control-keys.enum";
import { FormField } from "../types/FormField";

export interface ControlComponentProps {
  formField: FormField;
  formMethods: import("react-hook-form").UseFormReturn<Record<string, unknown>>;

  /** This prop below for the controls inside the table grid*/
  hideLabel?: boolean;
  hideHelperText?: boolean;
  size?: "small" | "medium";
  isGridField?: boolean;
}

export const getControlKey = (field: FormField): ControlKeys => {
  return field.controlType.controlKey as ControlKeys;
};

export const getControlType = (
  controlKey: ControlKeys
): React.ComponentType<ControlComponentProps> | undefined => {
  const controlTypes: Partial<
    Record<ControlKeys, React.ComponentType<ControlComponentProps>>
  > = {
    [ControlKeys.Text]: InputField,
    [ControlKeys.Number]: InputField,
    [ControlKeys.Percentage]: PercentageField,
    [ControlKeys.Datepicker]: DatePicker,
    [ControlKeys.Dropdown]: DropDown,
    [ControlKeys.Multiselect]: MultiSelect,
    [ControlKeys.Table]: TableGrid,
    [ControlKeys.RawTable]: RawTable,
    [ControlKeys.Label]: Label,
    [ControlKeys.CalculatedField]: CalculatedField,
  };

  return controlTypes[controlKey];
};
