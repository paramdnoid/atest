import type { FormulaTemplateId } from '@/lib/aufmass/types';
import { getTemplatesForUnit } from '@/lib/aufmass/formula-builder';
import { parseFormulaTemplateId } from '@/lib/aufmass/guards';
import type { AufmassUnit } from '@/lib/aufmass/types';

type FormulaTemplateSelectProps = {
  unit: AufmassUnit;
  templateId: FormulaTemplateId;
  onTemplateChange: (templateId: FormulaTemplateId) => void;
};

export function FormulaTemplateSelect({
  unit,
  templateId,
  onTemplateChange,
}: FormulaTemplateSelectProps) {
  const templates = getTemplatesForUnit(unit);
  const effectiveTemplate = templates.find((template) => template.id === templateId) ?? templates[0];

  if (!effectiveTemplate) return null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="capture-template">
        Formel-Template
      </label>
      <select
        id="capture-template"
        value={effectiveTemplate.id}
        onChange={(event) => {
          const allowed = templates.map((template) => template.id);
          const next = parseFormulaTemplateId(event.target.value, allowed);
          if (!next) return;
          onTemplateChange(next);
        }}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
      >
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.label}
          </option>
        ))}
      </select>
    </div>
  );
}
