import { FormulaOperandInput } from '@/components/aufmass/formula-builder/formula-operand-input';
import { FormulaPreview } from '@/components/aufmass/formula-builder/formula-preview';
import { FormulaTemplateSelect } from '@/components/aufmass/formula-builder/formula-template-select';
import { FormulaValidationBanner } from '@/components/aufmass/formula-builder/formula-validation-banner';
import type { BuilderInputValues } from '@/lib/aufmass/formula-builder';
import type { FormulaQuality } from '@/lib/aufmass/intelligence';
import type { FormulaEvaluation, FormulaTemplateId, AufmassUnit } from '@/lib/aufmass/types';

export type FormulaBuilderValue = {
  templateId: FormulaTemplateId;
  variables: BuilderInputValues;
};

type FormulaBuilderProps = {
  unit: AufmassUnit;
  value: FormulaBuilderValue;
  onChange: (value: FormulaBuilderValue) => void;
  formulaText: string;
  quantity: number;
  quality: FormulaQuality | null;
  evaluation: FormulaEvaluation;
};

export function FormulaBuilder({
  unit,
  value,
  onChange,
  formulaText,
  quantity,
  quality,
  evaluation,
}: FormulaBuilderProps) {
  return (
    <div className="space-y-2">
      <FormulaTemplateSelect
        unit={unit}
        templateId={value.templateId}
        onTemplateChange={(templateId) => onChange({ ...value, templateId })}
      />
      <FormulaOperandInput
        values={value.variables}
        onChange={(variables) => onChange({ ...value, variables })}
      />
      <FormulaPreview formulaText={formulaText} quantity={quantity} unit={unit} />
      <FormulaValidationBanner quality={quality} evaluation={evaluation} />
    </div>
  );
}
