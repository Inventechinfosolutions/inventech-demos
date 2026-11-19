import { useMemo } from "react"
import { fieldOf } from "@/analytics/catalog"
import { Button, MultiSelect, Segmented, fieldClass } from "@/analytics/components/ui"
import { describeFilters, distinctValues, emptyGroup, isConditionComplete, isFilterable, newId, operatorLabel, operatorsFor } from "@/analytics/engine"
import type { Combinator, Dataset, DatasetField, FilterCondition, FilterGroup, FilterNode } from "@/analytics/types"

const MAX_DEPTH = 2

function defaultField(dataset: Dataset, allowed?: string[]) {
  const candidates = dataset.fields.filter((field) => isFilterable(field) && (!allowed || allowed.includes(field.id)))
  return candidates.find((field) => field.id === dataset.defaultDimension) ?? candidates[0]
}

export function newCondition(dataset: Dataset, allowed?: string[]): FilterCondition | null {
  const field = defaultField(dataset, allowed)
  if (!field) return null
  return { id: newId("fc"), kind: "condition", fieldId: field.id, operator: operatorsFor(field)[0] }
}

function ValueInput({ dataset, field, condition, onChange }: { dataset: Dataset; field: DatasetField; condition: FilterCondition; onChange: (patch: Partial<FilterCondition>) => void }) {
  const options = useMemo(() => (field.dataType === "string" ? (field.values ?? distinctValues(dataset.id, field.id, 300)) : []), [dataset.id, field])
  const complete = isConditionComplete(condition)
  const invalid = complete ? "" : "border-[color:var(--c-border-daa1a8)]"

  if (condition.operator === "in") {
    return <MultiSelect label={field.label} searchable allLabel="Choose values" options={options} value={condition.list ?? []} onChange={(list) => onChange({ list })} className="min-w-0 flex-1" />
  }
  const type = field.dataType === "date" ? "date" : field.dataType === "number" ? "number" : "text"
  if ((condition.operator === "eq" || condition.operator === "neq") && field.dataType === "string" && options.length > 0 && options.length <= 80) {
    return (
      <select aria-label={`${field.label} value`} className={`${fieldClass} ${invalid}`} value={condition.value ?? ""} onChange={(event) => onChange({ value: event.target.value })}>
        <option value="">Choose a value</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }
  const two = condition.operator === "between" || condition.operator === "dateRange"
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-1.5`}>
      <input aria-label={`${field.label} ${two ? "from" : "value"}`} type={type} inputMode={type === "number" ? "decimal" : undefined} className={`${fieldClass} ${invalid}`} placeholder={condition.operator === "contains" ? "Text to find" : "Value"} value={condition.value ?? ""} onChange={(event) => onChange({ value: event.target.value })} />
      {two ? (
        <>
          <span className="text-xs text-[color:var(--c-text-9d8189)]">to</span>
          <input aria-label={`${field.label} to`} type={type} inputMode={type === "number" ? "decimal" : undefined} className={`${fieldClass} ${invalid}`} placeholder="Value" value={condition.value2 ?? ""} onChange={(event) => onChange({ value2: event.target.value })} />
        </>
      ) : null}
    </div>
  )
}

export function ConditionRow({ dataset, condition, allowed, onChange, onRemove }: { dataset: Dataset; condition: FilterCondition; allowed?: string[]; onChange: (next: FilterCondition) => void; onRemove: () => void }) {
  const field = fieldOf(dataset, condition.fieldId)
  const choices = dataset.fields.filter((item) => isFilterable(item) && (!allowed || allowed.includes(item.id)))
  const groups: [string, DatasetField[]][] = [
    ["Dimensions", choices.filter((item) => item.kind === "dimension")],
    ["Dates", choices.filter((item) => item.kind === "date")],
    ["Measures", choices.filter((item) => item.kind === "measure")],
  ]
  const changeField = (fieldId: string) => {
    const next = fieldOf(dataset, fieldId)
    if (!next) return
    const operators = operatorsFor(next)
    onChange({ id: condition.id, kind: "condition", fieldId, operator: operators.includes(condition.operator) ? condition.operator : operators[0] })
  }
  const complete = isConditionComplete(condition)
  return (
    <div className="rounded-xl border border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <select aria-label="Filter field" className={`${fieldClass} !w-auto min-w-[8.5rem] flex-1`} value={condition.fieldId} onChange={(event) => changeField(event.target.value)}>
          {groups.map(([label, list]) =>
            list.length ? (
              <optgroup key={label} label={label}>
                {list.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ) : null,
          )}
        </select>
        {field ? (
          <select aria-label="Filter operator" className={`${fieldClass} !w-auto min-w-[8rem]`} value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as FilterCondition["operator"], list: undefined })}>
            {operatorsFor(field).map((operator) => (
              <option key={operator} value={operator}>
                {operatorLabel(operator, field)}
              </option>
            ))}
          </select>
        ) : null}
        <button type="button" aria-label="Remove condition" onClick={onRemove} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-[color:var(--c-text-9d8189)] hover:bg-[color:var(--c-bg-fee4d8)] hover:text-[color:var(--c-text-8c2f39)]">
          ×
        </button>
      </div>
      {field ? (
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <ValueInput dataset={dataset} field={field} condition={condition} onChange={(patch) => onChange({ ...condition, ...patch })} />
        </div>
      ) : null}
      {!complete ? <p className="mt-1 text-xs text-[color:var(--c-text-b23a48)]">Add a value to apply this filter.</p> : null}
    </div>
  )
}

function GroupEditor({ dataset, group, depth, onChange, onRemove }: { dataset: Dataset; group: FilterGroup; depth: number; onChange: (next: FilterGroup) => void; onRemove?: () => void }) {
  const update = (index: number, node: FilterNode) => onChange({ ...group, children: group.children.map((child, position) => (position === index ? node : child)) })
  const remove = (index: number) => onChange({ ...group, children: group.children.filter((_, position) => position !== index) })
  const add = () => {
    const condition = newCondition(dataset)
    if (condition) onChange({ ...group, children: [...group.children, condition] })
  }
  return (
    <div className={depth > 0 ? "rounded-xl border border-dashed border-[color:var(--c-border-e9c6ca)] bg-[color:var(--c-bg-ffffff)] p-2" : ""}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[color:var(--c-text-86646d)]">Match</span>
          <Segmented<Combinator> label="Combine conditions" value={group.combinator} onChange={(combinator) => onChange({ ...group, combinator })} options={[{ id: "AND", label: "All (AND)" }, { id: "OR", label: "Any (OR)" }]} />
        </div>
        {onRemove ? (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove group
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {group.children.map((child, index) =>
          child.kind === "condition" ? (
            <div key={child.id} className="relative">
              {index > 0 ? <span className="absolute -top-2 left-3 z-[1] rounded-full bg-[color:var(--c-bg-ffede5)] px-1.5 text-[10px] font-semibold text-[color:var(--c-text-8c2f39)]">{group.combinator}</span> : null}
              <ConditionRow dataset={dataset} condition={child} onChange={(next) => update(index, next)} onRemove={() => remove(index)} />
            </div>
          ) : (
            <div key={child.id} className="relative">
              {index > 0 ? <span className="absolute -top-2 left-3 z-[1] rounded-full bg-[color:var(--c-bg-ffede5)] px-1.5 text-[10px] font-semibold text-[color:var(--c-text-8c2f39)]">{group.combinator}</span> : null}
              <GroupEditor dataset={dataset} group={child} depth={depth + 1} onChange={(next) => update(index, next)} onRemove={() => remove(index)} />
            </div>
          ),
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button size="sm" onClick={add}>
          + Condition
        </Button>
        {depth < MAX_DEPTH ? (
          <Button size="sm" onClick={() => onChange({ ...group, children: [...group.children, emptyGroup(group.combinator === "AND" ? "OR" : "AND")] })}>
            + Group
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function FilterBuilder({ dataset, value, onChange }: { dataset: Dataset; value: FilterGroup; onChange: (next: FilterGroup) => void }) {
  const sentence = describeFilters(value, dataset)
  return (
    <div>
      {value.children.length === 0 ? <p className="mb-2 text-sm text-[color:var(--c-text-86646d)]">No filters. The report covers every record you can access.</p> : null}
      <GroupEditor dataset={dataset} group={value} depth={0} onChange={onChange} />
      {sentence.length > 0 ? (
        <p className="mt-3 rounded-lg bg-[color:var(--c-bg-ffeee7)] px-3 py-2 text-xs leading-5 text-[color:var(--c-text-663a46)]">
          <span className="font-semibold text-[color:var(--c-text-8c2f39)]">Reads as: </span>
          {sentence.join(value.combinator === "AND" ? " AND " : " OR ")}
        </p>
      ) : null}
    </div>
  )
}

/** Flat list of AND conditions. Used for widget filters, where nesting is unnecessary. */
export function ConditionList({ dataset, conditions, onChange, allowed }: { dataset: Dataset; conditions: FilterCondition[]; onChange: (next: FilterCondition[]) => void; allowed?: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {conditions.map((condition) => (
        <ConditionRow key={condition.id} dataset={dataset} condition={condition} allowed={allowed} onChange={(next) => onChange(conditions.map((item) => (item.id === condition.id ? next : item)))} onRemove={() => onChange(conditions.filter((item) => item.id !== condition.id))} />
      ))}
      <div>
        <Button
          size="sm"
          onClick={() => {
            const condition = newCondition(dataset, allowed)
            if (condition) onChange([...conditions, condition])
          }}
        >
          + Add filter
        </Button>
      </div>
    </div>
  )
}
