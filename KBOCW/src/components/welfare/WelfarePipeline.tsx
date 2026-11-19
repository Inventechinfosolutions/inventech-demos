import type { WelfareStage } from "@/types/welfare"

export function WelfarePipeline({ stages, activeId, onSelect }: { stages: WelfareStage[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
      {stages.map((stage, index) => {
        const selected = activeId === stage.id || (activeId === "all" && stage.id === "received")
        return (
          <li key={stage.id}>
            <button
              type="button"
              onClick={() => onSelect(stage.id)}
              className={`flex h-full w-full flex-col rounded-lg border px-3 py-3 text-left ${selected ? "border-[color:var(--c-border-b23a48)] bg-[color:var(--c-bg-fff0ea)]" : "border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)]"}`}
            >
              <span className="text-[13px] font-medium text-[color:var(--c-text-8c2f39)]">
                {index + 1}. {stage.label}
              </span>
              <span className="mt-2 text-lg font-semibold text-[color:var(--c-text-461220)] tabular-nums">{stage.displayValue}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
