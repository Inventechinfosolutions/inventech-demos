import { CornersOut, Question, SquaresFour } from "@/lib/icons";
import { DeckFooter } from "@/components/DeckFooter";
import { KaMark } from "@/components/SlideKit";
import { SlideViewport } from "@/components/SlideViewport";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePresenter } from "@/hooks/usePresenter";
import { DEPT, SCENES } from "@/lib/deck";
import { cn } from "@/lib/utils";
import { UnderstandingScene } from "@/scenes/UnderstandingScene";
import { ChallengeScene } from "@/scenes/ChallengeScene";
import { SolutionScene } from "@/scenes/SolutionScene";
import { CampaignScene } from "@/scenes/CampaignScene";
import { ApprovalScene } from "@/scenes/ApprovalScene";
import { AssetScene } from "@/scenes/AssetScene";
import { ExecutionScene } from "@/scenes/ExecutionScene";
import { VendorScene } from "@/scenes/VendorScene";
import { FieldScene } from "@/scenes/FieldScene";
import { VerifyScene } from "@/scenes/VerifyScene";
import { MonitorScene } from "@/scenes/MonitorScene";
import { DashboardScene } from "@/scenes/DashboardScene";
import { ReportsScene } from "@/scenes/ReportsScene";
import { AccessScene } from "@/scenes/AccessScene";
import { IntegrationScene } from "@/scenes/IntegrationScene";
import { ArchitectureScene } from "@/scenes/ArchitectureScene";
import { QualityScene } from "@/scenes/QualityScene";
import { RoadmapScene } from "@/scenes/RoadmapScene";
import { SupportScene } from "@/scenes/SupportScene";
import { SummaryScene } from "@/scenes/SummaryScene";
import { EcosystemScene } from "@/scenes/EcosystemScene";
import stageBg from "@/assets/stage-bg.jpg";
import headerPhoto from "@/assets/title-bg.webp";
import { ThanksScene } from "@/scenes/ThanksScene";
import { TitleScene } from "@/scenes/TitleScene";

/** Gold-highlighted ending of each scene title in the header. */
const TITLE_HIGHLIGHT: Record<string, string> = {
  understanding: "Understanding",
  challenge: "Multiple Channels",
  solution: "Complete Advertising Lifecycle",
  campaign: "Structured Digital Request",
  approval: "Approved Media Plan",
  assets: "One Centralized Repository.",
  execution: "Multiple Advertising Channels.",
  vendors: "Empanelled Agencies",
  field: "to the Field",
  verify: "Verifiable Evidence",
  monitor: "Centralized Monitoring",
  dashboard: "One Consolidated Dashboard.",
  reports: "Actionable Reports",
  access: "Controlled and Accountable.",
  integration: "DIPR Digital Ecosystem",
  architecture: "Application Architecture",
  quality: "Every Stage of Development",
  roadmap: "18-Week Implementation Roadmap",
  support: "Operational Support and Continuity",
  summary: "Complete Advertising Intelligence",
  ecosystem: "Application Ecosystem",
};

function headTitle(id: string, title: string) {
  const mark = TITLE_HIGHLIGHT[id];
  if (!mark || !title.endsWith(mark)) return title;
  return (
    <>
      {title.slice(0, -mark.length)}
      <span className="rounded-md bg-gold px-[0.25em] py-[0.04em] whitespace-nowrap text-navy-deep">{mark}</span>
    </>
  );
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
};

export default function App() {
  const p = usePresenter();

  return (
    <div
      className="flex h-full flex-col bg-background"
      onClick={() => p.next()}
      onDoubleClick={(e) => {
        e.preventDefault();
        toggleFullscreen();
      }}
    >
      {p.slide !== 0 && p.scene.id !== "thanks" && (
        <header
          className="relative isolate z-20 flex h-14 shrink-0 items-center gap-2 overflow-hidden bg-linear-to-b from-navy-deep to-navy px-2.5 text-white sm:h-[clamp(4.75rem,min(6vw,10vh),6.25rem)] sm:gap-4 sm:px-4"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <img
            src={headerPhoto}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-[55%] object-cover object-[50%_45%] opacity-45 [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.7)_40%,#000_70%)]"
          />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <KaMark className="size-9 shrink-0 sm:size-[clamp(2.25rem,min(3vw,5vh),3rem)]" />
            <span className="min-w-0 max-sm:hidden">
              <span className="font-display block text-[length:clamp(11px,min(0.8vw,1.4vh),13px)] leading-tight font-bold">
                Department of Information
                <br />
                and Public Relations ({DEPT.short})
              </span>
              <small className="mt-0.5 block font-sans text-[length:clamp(9px,min(0.62vw,1.1vh),10px)] font-medium tracking-[0.1em] text-white/70 uppercase">
                {DEPT.gov}
              </small>
            </span>
          </div>
          <div className="min-w-0 flex-1 px-1 text-center sm:px-2">
            <div className="font-display text-[length:clamp(15px,min(1.95vw,3.6vh),32px)] leading-none font-black tracking-[-0.02em] uppercase">
              {headTitle(p.scene.id, p.scene.title)}
            </div>
          </div>
          <div className="rounded-full bg-navy-deep/60 px-2 py-1 font-display text-[10px] tracking-widest ring-1 ring-white/15 backdrop-blur-sm sm:px-3 sm:text-xs">
            {`${String(p.slide).padStart(2, "0")} / ${String(SCENES.length - 2).padStart(2, "0")}`}
          </div>
          <Button variant="ghost" size="icon" className="size-8 shrink-0 text-white hover:bg-white/10 sm:size-9" onClick={() => p.setOverview(true)}>
            <SquaresFour weight="bold" className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden size-8 shrink-0 text-white hover:bg-white/10 sm:inline-flex sm:size-9" onClick={toggleFullscreen}>
            <CornersOut weight="bold" className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 shrink-0 text-white hover:bg-white/10 sm:size-9" onClick={() => p.setHelp(true)}>
            <Question weight="bold" className="size-4" />
          </Button>
        </header>
      )}

      <main className="relative min-h-0 flex-1">
        {p.slide === 0 ? (
          <TitleScene beat={p.beat} />
        ) : (
          <SlideViewport style={{ background: `linear-gradient(180deg, rgba(240,247,255,0.55), rgba(232,242,252,0.35)), url(${stageBg}) center bottom / cover no-repeat` }}>
            {p.scene.id === "understanding" && <UnderstandingScene beat={p.beat} />}
            {p.scene.id === "challenge" && <ChallengeScene beat={p.beat} />}
            {p.scene.id === "solution" && <SolutionScene beat={p.beat} />}
            {p.scene.id === "campaign" && <CampaignScene beat={p.beat} />}
            {p.scene.id === "approval" && <ApprovalScene beat={p.beat} />}
            {p.scene.id === "assets" && <AssetScene beat={p.beat} />}
            {p.scene.id === "execution" && <ExecutionScene beat={p.beat} />}
            {p.scene.id === "vendors" && <VendorScene beat={p.beat} />}
            {p.scene.id === "field" && <FieldScene beat={p.beat} />}
            {p.scene.id === "verify" && <VerifyScene beat={p.beat} />}
            {p.scene.id === "monitor" && <MonitorScene beat={p.beat} />}
            {p.scene.id === "dashboard" && <DashboardScene beat={p.beat} />}
            {p.scene.id === "reports" && <ReportsScene beat={p.beat} />}
            {p.scene.id === "access" && <AccessScene beat={p.beat} />}
            {p.scene.id === "integration" && <IntegrationScene beat={p.beat} />}
            {p.scene.id === "architecture" && <ArchitectureScene beat={p.beat} />}
            {p.scene.id === "quality" && <QualityScene beat={p.beat} />}
            {p.scene.id === "roadmap" && <RoadmapScene beat={p.beat} />}
            {p.scene.id === "support" && <SupportScene beat={p.beat} />}
            {p.scene.id === "summary" && <SummaryScene beat={p.beat} />}
            {p.scene.id === "ecosystem" && <EcosystemScene beat={p.beat} />}
            {p.scene.id === "thanks" && <ThanksScene />}
          </SlideViewport>
        )}
      </main>

      <DeckFooter slide={p.slide} beat={p.beat} scene={p.scene} onGoTo={p.goTo} onPrev={p.prev} onNext={p.next} />

      <Dialog open={p.overview} onOpenChange={p.setOverview}>
        <DialogContent className="max-h-[80vh] w-[min(1100px,94vw)] overflow-auto bg-navy-deep/95" onClick={(e) => e.stopPropagation()}>
          <DialogTitle className="mb-4">Jump to a scene</DialogTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => p.goTo(i, 0)}
                className={cn(
                  "min-h-24 rounded-2xl border border-white/10 bg-white/10 p-3 text-left text-white sm:min-h-28 sm:p-4",
                  i === p.slide && "ring-2 ring-teal-bright",
                )}
              >
                <span className="block text-[11px] tracking-widest text-teal-bright">{i === 0 ? "Open" : String(i).padStart(2, "0")}</span>
                <span className="font-display mt-2 block text-base sm:text-lg">{s.title}</span>
                <span className="mt-2 block text-xs text-white/60 sm:text-sm">{s.kicker}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={p.help} onOpenChange={p.setHelp}>
        <DialogContent className="w-[min(520px,94vw)]" onClick={(e) => e.stopPropagation()}>
          <DialogTitle>Presenter controls</DialogTitle>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {[
                ["→ · Space · Click", "Next beat, then next scene"],
                ["← · Backspace", "Previous beat / scene"],
                ["O · Esc", "Slide overview"],
                ["F · Double-click", "Fullscreen"],
                ["0–9", "Jump to scene"],
                ["? · H", "This help"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-white/10">
                  <td className="w-36 py-2 align-top font-bold text-teal-bright sm:w-44">{k}</td>
                  <td className="py-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
