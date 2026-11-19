import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ResultMeta } from "@/analytics/components/ResultMeta"
import { Button, Notice, Segmented, cardClass, fieldClass } from "@/analytics/components/ui"
import { ResultTable, VizRenderer } from "@/analytics/components/VizRenderer"
import { VIZ_LABELS } from "@/analytics/engine"
import { useQuery } from "@/analytics/hooks"
import { EXAMPLE_QUESTIONS, interpretQuestion } from "@/analytics/nlq"
import type { NlqInterpretation } from "@/analytics/nlq"
import { useCurrentUser } from "@/analytics/session"

/** Ask a question in plain words. The text is matched to a governed report definition. No SQL is written or accepted. */
export function NlqPanel() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [text, setText] = useState("")
  const [answer, setAnswer] = useState<NlqInterpretation | null>(null)
  const [view, setView] = useState<"chart" | "table">("chart")

  const ask = (question: string) => {
    setText(question)
    setAnswer(interpretQuestion(question, user))
    setView("chart")
  }
  const def = answer?.ok ? (answer.def ?? null) : null
  const { data, loading } = useQuery({ def, log: def ? { kind: "nlq", reportId: null, reportName: answer?.title ?? "Question" } : null })
  const outcome = data?.outcome

  return (
    <section className={`${cardClass} p-5 sm:p-6`} aria-label="Ask a question">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[color:var(--c-text-8c2f39)] uppercase">Ask a question</p>
          <h2 className="mt-1 text-lg font-semibold text-[color:var(--c-text-461220)]">Get a quick answer from governed data</h2>
        </div>
      </div>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          if (text.trim()) ask(text)
        }}
      >
        <input aria-label="Your question" className={`${fieldClass} !h-11 flex-1 !rounded-full px-4 text-[15px]`} placeholder="For example: pending welfare applications by district" value={text} onChange={(event) => setText(event.target.value)} />
        <Button variant="primary" className="!h-11 px-6" type="submit" disabled={!text.trim()}>
          Ask
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLE_QUESTIONS.map((question) => (
          <button key={question} type="button" onClick={() => ask(question)} className="rounded-full border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-fff8f4)] px-3 py-1.5 text-xs font-medium text-[color:var(--c-text-663a46)] hover:border-[color:var(--c-border-b23a48)]">
            {question}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-[color:var(--c-text-9d8189)]">Questions are matched to a fixed set of patterns. The answer always shows how it was read, which filters were used and how each metric is defined.</p>

      {answer && !answer.ok ? (
        <div className="mt-4">
          <Notice tone="brass" title="That question is outside the supported patterns">
            {answer.message}
            {answer.suggestions.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {answer.suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-full border border-[color:var(--c-border-e9c7cb)] bg-[color:var(--c-bg-ffffff)] px-3 py-1 text-xs font-medium hover:border-[color:var(--c-border-b23a48)]">
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </Notice>
        </div>
      ) : null}

      {answer?.ok && def ? (
        <div className="mt-5 rounded-2xl border border-[color:var(--c-border-fee2d5)] bg-[color:var(--c-bg-fff8f4)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[color:var(--c-text-8c2f39)]">How your question was read</p>
              <h3 className="mt-0.5 text-base font-semibold text-[color:var(--c-text-461220)]">{answer.title}</h3>
              <ul className="mt-1.5 list-disc pl-5 text-sm leading-6 text-[color:var(--c-text-663a46)]">
                {answer.summary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {def.visualization.type !== "table" && def.visualization.type !== "kpi" ? (
                <Segmented label="Result view" value={view} onChange={setView} options={[{ id: "chart", label: VIZ_LABELS[def.visualization.type].split(" ")[0] }, { id: "table", label: "Table" }]} />
              ) : null}
              <Button size="sm" onClick={() => navigate("/analytics/build-report", { state: { definition: def, nonce: Date.now() } })}>
                Customise in builder
              </Button>
            </div>
          </div>
          <div className={`mt-4 rounded-xl bg-[color:var(--c-bg-ffffff)] p-3 ${loading ? "opacity-60" : ""}`}>
            {!outcome ? (
              <div className="h-[260px] animate-pulse rounded-xl bg-[color:var(--c-bg-ffeee7)]" />
            ) : !outcome.ok ? (
              <div className="flex flex-col gap-2">
                {outcome.issues.map((issue) => (
                  <Notice key={issue.code} tone="red">
                    {issue.message}
                  </Notice>
                ))}
              </div>
            ) : view === "table" ? (
              <ResultTable result={outcome.result} />
            ) : (
              <VizRenderer result={outcome.result} type={def.visualization.type} showLabels={def.visualization.showLabels} stacked={def.visualization.stacked} height={320} />
            )}
          </div>
          {outcome?.ok ? <ResultMeta result={outcome.result} /> : null}
        </div>
      ) : null}
    </section>
  )
}
