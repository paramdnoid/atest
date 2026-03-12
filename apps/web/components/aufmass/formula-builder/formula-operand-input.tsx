import { Input } from '@/components/ui/input';
import type { BuilderInputValues } from '@/lib/aufmass/formula-builder';
import type { FormulaVariableKey } from '@/lib/aufmass/types';

const operandOrder: Array<{ key: FormulaVariableKey; label: string; defaultValue: number }> = [
  { key: 'length', label: 'Länge', defaultValue: 0 },
  { key: 'width', label: 'Breite', defaultValue: 0 },
  { key: 'height', label: 'Höhe', defaultValue: 0 },
  { key: 'openings', label: 'Öffnungen', defaultValue: 0 },
  { key: 'factor', label: 'Faktor', defaultValue: 1 },
  { key: 'count', label: 'Anzahl', defaultValue: 1 },
];

type FormulaOperandInputProps = {
  values: BuilderInputValues;
  onChange: (values: BuilderInputValues) => void;
};

export function FormulaOperandInput({ values, onChange }: FormulaOperandInputProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {operandOrder.map((operand) => (
        <Input
          key={operand.key}
          type="number"
          value={values[operand.key] ?? operand.defaultValue}
          onChange={(event) =>
            onChange({
              ...values,
              [operand.key]: Number(event.target.value || operand.defaultValue),
            })
          }
          placeholder={operand.label}
        />
      ))}
    </div>
  );
}
