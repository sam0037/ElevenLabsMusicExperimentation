import { useMemo, useState } from "react";
import { BookHeart, Brain, HeartPulse, Waves } from "lucide-react";
import { Card } from "./ui/card";
import meditationTools from "../../../music_composer_python/meditation_tool.json";
import {
  type MeditationTool,
} from "../../services/meditation-music-parameter-service";
import { MyPrayersClubWorkflowDialog, type MyPrayersClubWorkflowSeed } from "./MyPrayersClubWorkflowDialog";
import { formatLabel, formatToolName } from "./myprayersclub-utils";

type ToolSectionProps = {
  title: string;
  icon: React.ReactNode;
  description: string;
  tools: MeditationTool[];
  onSelectTool: (toolId: string) => void;
};

function ToolSection({ title, icon, description, tools, onSelectTool }: ToolSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
            {icon}
            <span>{title}</span>
          </div>
          <div>
            <h2 className="text-2xl text-foreground">{title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur">
          {tools.length} tools
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {tools.map((tool) => (
          <Card
            key={tool.id}
            className="overflow-hidden rounded-3xl border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,250,255,0.88))] p-0 shadow-[0_20px_60px_rgba(15,56,112,0.08)] transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="border-b border-sky-100/80 bg-[linear-gradient(135deg,rgba(14,165,233,0.1),rgba(255,255,255,0.25))] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-sky-700/80">
                    Meditation Tool
                  </p>
                  <h3 className="text-xl leading-tight text-foreground">
                    {formatToolName(tool.id)}
                  </h3>
                </div>
                <div className="rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-medium text-sky-700">
                  {formatLabel(tool.nervous_system_direction)}
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <p className="text-sm leading-7 text-muted-foreground">
                {tool.description}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Tempo Range
                  </p>
                  <p className="mt-2 text-base font-medium text-foreground">
                    {tool.tempo_range_bpm[0]}-{tool.tempo_range_bpm[1]} BPM
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Texture Density
                  </p>
                  <p className="mt-2 text-base font-medium text-foreground">
                    {formatLabel(tool.texture_density)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Preferred Music Styles
                </p>
                <div className="flex flex-wrap gap-2">
                  {tool.preferred_music_styles.map((style) => (
                    <span
                      key={style}
                      className="rounded-full border border-amber-200/80 bg-amber-50/90 px-3 py-1.5 text-xs font-medium text-amber-900"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label={`Open Generate Music for ${formatToolName(tool.id)}`}
              className="absolute inset-0 cursor-pointer rounded-3xl"
              onClick={() => onSelectTool(tool.id)}
            />
          </Card>
        ))}
      </div>
    </section>
  );
}

export function MyPrayersClubPage() {
  const allTools = useMemo(
    () => [...meditationTools.somatic_tools, ...meditationTools.psychology_tools] as MeditationTool[],
    [],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workflowSeed, setWorkflowSeed] = useState<MyPrayersClubWorkflowSeed | null>(null);

  const openGenerateMusicModal = (toolId: string) => {
    setWorkflowSeed({
      key: `${toolId}-${Date.now()}`,
      selectedToolId: toolId,
      generatedParameters: null,
      generatedPlan: null,
      generatedElevenLabsPlan: null,
      generatedMusic: null,
      currentStep: 1,
      highestStepReached: 1,
    });
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_45%),radial-gradient(circle_at_right,rgba(245,158,11,0.14),transparent_28%)]" />

        <div className="mx-auto mt-10 mb-10" style={{ width: '90%' }}>
          <div className="mx-auto flex flex-col gap-10 w-full">
            <section className="rounded-[2rem] border border-white/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(248,250,255,0.8))] p-8 shadow-[0_24px_80px_rgba(15,56,112,0.12)] backdrop-blur-xl md:p-10">
              <div className="max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/90 px-4 py-2 text-sm text-sky-800">
                  <BookHeart className="h-4 w-4" />
                  <span>Read-only Meditation Library</span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl leading-tight text-foreground md:text-5xl">
                    MyPrayersClub
                  </h1>
                  <p className="text-base leading-7 text-muted-foreground md:text-lg">
                    A calm, minimal overview of every meditation tool defined in the
                    source library, organized for easy reading and quiet browsing.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 shadow-sm">
                    <HeartPulse className="h-4 w-4 text-sky-700" />
                    <span>{meditationTools.somatic_tools.length} somatic tools</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 shadow-sm">
                    <Brain className="h-4 w-4 text-amber-700" />
                    <span>{meditationTools.psychology_tools.length} psychology tools</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="space-y-10">
              <ToolSection
                title="Somatic Tools"
                icon={<Waves className="h-4 w-4 text-sky-700" />}
                description="Body-first practices designed to regulate stress, settle the nervous system, or raise energy through breath, awareness, and physical relaxation."
                tools={meditationTools.somatic_tools as MeditationTool[]}
                onSelectTool={openGenerateMusicModal}
              />

              <ToolSection
                title="Psychology Tools"
                icon={<Brain className="h-4 w-4 text-amber-700" />}
                description="Mind-focused practices that support reflection, reframing, behavior design, emotional processing, and intentional action."
                tools={meditationTools.psychology_tools as MeditationTool[]}
                onSelectTool={openGenerateMusicModal}
              />
            </div>
          </div>
        </div>
      </div>

      <MyPrayersClubWorkflowDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        allTools={allTools}
        workflowSeed={workflowSeed}
      />
    </>
  );
}
