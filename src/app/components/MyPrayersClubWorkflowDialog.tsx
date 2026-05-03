import { useEffect, useMemo, useRef, useState } from "react";
import {
  LoaderCircle,
  Download,
  Play,
  Pause,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  generateMusicTrackParameters,
  type MeditationTool,
  type MusicTrackParameters,
} from "../../services/meditation-music-parameter-service";
import {
  generateMusicCompositionPlan,
  type MusicCompositionPlan,
} from "../../services/music-composition-plan-service";
import {
  ElevenLabsService,
  type CompositionPlanResponse,
} from "../../services/elevenlabs-service";
import { isElevenLabsConfigured } from "../../config/api-config";
import { MyPrayersClubDownloadService } from "../../services/myprayersclub-download-service";
import { GenerateMusicWorkflowSidebar } from "./GenerateMusicWorkflowSidebar";
import { formatLabel, formatToolName } from "./myprayersclub-utils";

type WorkflowStep = 1 | 2 | 3 | 4;

type GeneratedMusicState = {
  audioBlob: Blob | null;
  audioUrl: string;
  format: string;
  duration: string;
  fileSize: string;
  processingTime: string;
};

export type MyPrayersClubWorkflowSeed = {
  key: string;
  selectedToolId: string;
  generatedParameters: MusicTrackParameters | null;
  generatedPlan: MusicCompositionPlan | null;
  generatedElevenLabsPlan: CompositionPlanResponse | null;
  generatedMusic: GeneratedMusicState | null;
  currentStep: WorkflowStep;
  highestStepReached: WorkflowStep;
  lockPreviousStepRegeneration?: boolean;
};

type MyPrayersClubWorkflowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTools: MeditationTool[];
  workflowSeed: MyPrayersClubWorkflowSeed | null;
};

function buildGeneratedMusicFromResponse(response: Awaited<ReturnType<ElevenLabsService["generateMusic"]>>, audioUrl: string): GeneratedMusicState {
  return {
    audioBlob: response.audioBlob,
    audioUrl,
    format: response.format,
    duration: response.duration,
    fileSize: response.fileSize,
    processingTime: response.processingTime,
  };
}

export function MyPrayersClubWorkflowDialog({
  open,
  onOpenChange,
  allTools,
  workflowSeed,
}: MyPrayersClubWorkflowDialogProps) {
  const workflowSteps = useMemo(
    () => [
      { id: 1 as const, label: "Generate Parameters" },
      { id: 2 as const, label: "Composition Planner" },
      { id: 3 as const, label: "ElevenLab Composition Plan" },
      { id: 4 as const, label: "Generate Music" },
    ],
    [],
  );
  const stepCopy = {
    1: {
      title: "Generate Parameters",
      description: "Step 1: Generates music track parameters.",
    },
    2: {
      title: "Composition Planner",
      description: "Step 2: Builds the structured composition planner.",
    },
    3: {
      title: "ElevenLab Composition Plan",
      description: "Step 3: Sends the composition planner into ElevenLabs.",
    },
    4: {
      title: "Generate Music",
      description: "Step 4: Generate instrumental music track using the ElevenLabs.",
    },
  } as const;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string>(workflowSeed?.selectedToolId ?? allTools[0]?.id ?? "");
  const [generatedParameters, setGeneratedParameters] = useState<MusicTrackParameters | null>(workflowSeed?.generatedParameters ?? null);
  const [generatedPlan, setGeneratedPlan] = useState<MusicCompositionPlan | null>(workflowSeed?.generatedPlan ?? null);
  const [generatedElevenLabsPlan, setGeneratedElevenLabsPlan] = useState<CompositionPlanResponse | null>(workflowSeed?.generatedElevenLabsPlan ?? null);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusicState | null>(workflowSeed?.generatedMusic ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingElevenLabsPlan, setIsGeneratingElevenLabsPlan] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(workflowSeed?.currentStep ?? 1);
  const [highestStepReached, setHighestStepReached] = useState<WorkflowStep>(workflowSeed?.highestStepReached ?? 1);
  const [isPlayingGeneratedMusic, setIsPlayingGeneratedMusic] = useState(false);
  const [isGeneratedMusicLoopEnabled, setIsGeneratedMusicLoopEnabled] = useState(true);
  const [lockPreviousStepRegeneration, setLockPreviousStepRegeneration] = useState(Boolean(workflowSeed?.lockPreviousStepRegeneration));

  useEffect(() => {
    if (!workflowSeed || !open) {
      return;
    }

    setSelectedToolId(workflowSeed.selectedToolId);
    setGeneratedParameters(workflowSeed.generatedParameters);
    setGeneratedPlan(workflowSeed.generatedPlan);
    setGeneratedElevenLabsPlan(workflowSeed.generatedElevenLabsPlan);
    setGeneratedMusic(workflowSeed.generatedMusic);
    setCurrentStep(workflowSeed.currentStep);
    setHighestStepReached(workflowSeed.highestStepReached);
    setIsPlayingGeneratedMusic(false);
    setIsGeneratedMusicLoopEnabled(true);
    setLockPreviousStepRegeneration(Boolean(workflowSeed.lockPreviousStepRegeneration));
  }, [open, workflowSeed]);

  useEffect(() => {
    return () => {
      if (generatedMusic?.audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(generatedMusic.audioUrl);
      }
    };
  }, [generatedMusic]);

  const selectedTool = allTools.find((tool) => tool.id === selectedToolId) ?? null;
  const currentStepCopy = stepCopy[currentStep];

  const goToStep = (step: WorkflowStep) => {
    if (step <= highestStepReached) {
      setCurrentStep(step);
    }
  };

  const advanceToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
    setHighestStepReached((previous) => (step > previous ? step : previous));
  };

  const replaceGeneratedMusic = (nextGeneratedMusic: GeneratedMusicState | null) => {
    setGeneratedMusic((previous) => {
      if (previous?.audioUrl.startsWith("blob:") && previous.audioUrl !== nextGeneratedMusic?.audioUrl) {
        URL.revokeObjectURL(previous.audioUrl);
      }
      return nextGeneratedMusic;
    });
  };

  const handleGenerateParameters = async () => {
    if (!selectedTool || lockPreviousStepRegeneration) {
      return;
    }

    setIsGenerating(true);

    await new Promise((resolve) => window.setTimeout(resolve, 450));

    try {
      const parameters = generateMusicTrackParameters(selectedTool);
      setGeneratedParameters(parameters);
      setGeneratedPlan(null);
      setGeneratedElevenLabsPlan(null);
      replaceGeneratedMusic(null);
      toast.success("Music track parameters generated");
    } catch (error) {
      console.error("Failed to generate music parameters:", error);
      toast.error("Unable to generate music parameters");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextStep = () => {
    if (!generatedParameters) {
      return;
    }
    advanceToStep(2);
  };

  const handleGeneratePlan = async () => {
    if (!generatedParameters || lockPreviousStepRegeneration) {
      return;
    }

    setIsGeneratingPlan(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));

    try {
      const plan = generateMusicCompositionPlan(generatedParameters);
      setGeneratedPlan(plan);
      setGeneratedElevenLabsPlan(null);
      replaceGeneratedMusic(null);
      toast.success("Composition plan generated");
    } catch (error) {
      console.error("Failed to generate composition plan:", error);
      toast.error("Unable to generate composition plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleProceedAfterPlan = () => {
    if (!generatedPlan) {
      return;
    }
    advanceToStep(3);
  };

  const handleGenerateElevenLabsPlan = async () => {
    if (!generatedPlan || lockPreviousStepRegeneration) {
      return;
    }

    if (!isElevenLabsConfigured()) {
      toast.error("ElevenLabs API key is not configured");
      return;
    }

    setIsGeneratingElevenLabsPlan(true);

    try {
      const elevenLabsService = new ElevenLabsService();
      const response = await elevenLabsService.createMeditationCompositionPlan(
        JSON.stringify(generatedPlan),
      );
      setGeneratedElevenLabsPlan(response);
      replaceGeneratedMusic(null);
      toast.success("ElevenLab composition plan generated");
    } catch (error) {
      console.error("Failed to generate ElevenLab composition plan:", error);
      toast.error(error instanceof Error ? error.message : "Unable to generate ElevenLab composition plan");
    } finally {
      setIsGeneratingElevenLabsPlan(false);
    }
  };

  const handleProceedAfterElevenLabsPlan = () => {
    if (!generatedElevenLabsPlan) {
      return;
    }
    advanceToStep(4);
  };

  const blobToBase64 = async (blob: Blob) => {
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  };

  const buildFolderName = () => {
    const now = new Date();
    const dd = `${now.getDate()}`.padStart(2, "0");
    const mm = `${now.getMonth() + 1}`.padStart(2, "0");
    const yyyy = `${now.getFullYear()}`;
    const hh = `${now.getHours()}`.padStart(2, "0");
    const min = `${now.getMinutes()}`.padStart(2, "0");
    const ss = `${now.getSeconds()}`.padStart(2, "0");

    return [
      selectedTool?.id ?? "tool",
      generatedParameters?.feeling ?? "feeling",
      generatedParameters?.key ?? "root",
      generatedParameters?.tempo_bpm ?? "tempo",
      generatedPlan?.sections[0]?.duration_ms ?? "duration",
      `${dd}${mm}${yyyy}`,
      `${hh}${min}${ss}`,
    ].join("_");
  };

  const handleGenerateMusic = async () => {
    if (!generatedElevenLabsPlan || !generatedParameters || !generatedPlan || !selectedTool) {
      return;
    }

    if (!isElevenLabsConfigured()) {
      toast.error("ElevenLabs API key is not configured");
      return;
    }

    setIsGeneratingMusic(true);

    try {
      const elevenLabsService = new ElevenLabsService();
      const response = await elevenLabsService.generateMeditationMusic(generatedElevenLabsPlan);
      const audioUrl = URL.createObjectURL(response.audioBlob);
      replaceGeneratedMusic(buildGeneratedMusicFromResponse(response, audioUrl));

      const folderName = buildFolderName();
      const audioBase64 = await blobToBase64(response.audioBlob);
      const exportResponse = await MyPrayersClubDownloadService.saveBundle({
        folderName,
        audioBase64,
        audioFileName: "generated_music.mp3",
        parameters: generatedParameters,
        compositionPlan: generatedPlan,
        elevenLabsPlan: generatedElevenLabsPlan,
        generatedMusic: {
          toolId: selectedTool.id,
          feeling: generatedParameters.feeling,
          root: generatedParameters.key,
          tempo: generatedParameters.tempo_bpm,
          section_duration_ms: generatedPlan.sections[0]?.duration_ms,
          format: response.format,
          duration: response.duration,
          fileSize: response.fileSize,
          processingTime: response.processingTime,
          generatedAt: new Date().toISOString(),
        },
      });
      setIsPlayingGeneratedMusic(false);
      toast.success(`Music generated and saved to ${exportResponse.folderPath}`);
    } catch (error) {
      console.error("Failed to generate music:", error);
      toast.error(error instanceof Error ? error.message : "Unable to generate music");
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const handleToggleGeneratedMusic = () => {
    const audioElement = audioRef.current;
    if (!audioElement || !generatedMusic) {
      return;
    }

    if (audioElement.paused) {
      void audioElement.play();
      setIsPlayingGeneratedMusic(true);
    } else {
      audioElement.pause();
      setIsPlayingGeneratedMusic(false);
    }
  };

  const handleDownloadGeneratedMusic = async () => {
    if (!generatedMusic) {
      return;
    }

    try {
      const anchor = document.createElement("a");
      anchor.href = generatedMusic.audioUrl;
      anchor.download = `${buildFolderName()}.mp3`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      toast.success("Download started in your system Downloads folder");
    } catch (error) {
      console.error("Failed to download generated music:", error);
      toast.error(error instanceof Error ? error.message : "Unable to download generated music");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!left-[50%] !top-[50%] !flex !h-[90vh] !w-[90vw] !max-w-[90vw] !flex-col translate-x-[-50%] translate-y-[-50%] !gap-0 overflow-hidden rounded-[2rem] border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,248,255,0.96))] !p-0 shadow-[0_24px_80px_rgba(15,56,112,0.22)]">
        <DialogHeader className="shrink-0 border-b border-sky-100/80 px-7 py-6 text-left">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="break-words text-2xl text-foreground">
                {currentStepCopy.title}{selectedTool ? `: ${formatToolName(selectedTool.id)}` : ""}
              </DialogTitle>
              <DialogDescription className="break-words leading-6 text-muted-foreground">
                {currentStepCopy.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-7 py-6">
          <div className="space-y-6">
            <div className="grid min-w-0 gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
              <GenerateMusicWorkflowSidebar
                steps={workflowSteps}
                currentStep={currentStep}
                highestStepReached={highestStepReached}
                onSelectStep={goToStep}
              />

              <div className="min-w-0 space-y-5">
                {currentStep === 1 ? (
                  <>
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Selected Meditation Tool
                      </p>
                      <p className="mt-2 text-lg font-medium text-foreground">
                        {selectedTool ? formatToolName(selectedTool.id) : "No tool selected"}
                      </p>
                      {selectedTool ? (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {selectedTool.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Generated Music Track Parameters
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {lockPreviousStepRegeneration
                              ? "This saved session is read-only for steps 1 to 3."
                              : "Generate or retry to refresh the parameter set for the selected tool."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <Button
                            onClick={handleGenerateParameters}
                            disabled={isGenerating || !selectedTool || highestStepReached > 1 || lockPreviousStepRegeneration}
                          >
                            {isGenerating ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {generatedParameters ? "Regenerate" : "Generate Parameters"}
                          </Button>
                          <Button onClick={handleNextStep} disabled={!generatedParameters || isGenerating}>
                            Proceed To Next Step
                          </Button>
                        </div>
                      </div>

                      {generatedParameters ? (
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Feeling</p>
                            <p className="mt-2 text-lg font-medium text-foreground">
                              {formatLabel(generatedParameters.feeling)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Key / Mode</p>
                            <p className="mt-2 text-lg font-medium text-foreground">
                              {generatedParameters.key} {generatedParameters.mode}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tempo</p>
                            <p className="mt-2 text-lg font-medium text-foreground">
                              {generatedParameters.tempo_bpm} BPM
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">4-Bar Duration</p>
                            <p className="mt-2 text-lg font-medium text-foreground">
                              {generatedParameters.duration_4bar_ms.toLocaleString()} ms
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:col-span-2">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Emotional State Snapshot
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                              {Object.entries(generatedParameters.emotional_state).map(([key, value]) => (
                                <div key={key} className="rounded-xl bg-white px-3 py-2">
                                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                    {key}
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-foreground">
                                    {value.toFixed(2)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm leading-6 text-muted-foreground">
                          No parameters generated yet. Choose a meditation tool and use the generate button to run step 1.
                        </div>
                      )}
                    </div>
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Composition Planner
                      </p>
                      <p className="mt-2 text-lg font-medium text-foreground">
                        Template generation based on music track parameters
                      </p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        This step uses the generated feeling, key, tempo, and duration to assemble a four-section instrumental composition plan.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Generated Music Composition Plan
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {lockPreviousStepRegeneration
                              ? "This saved session is read-only for steps 1 to 3."
                              : "Generate or regenerate the composition planner output for the selected tool."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <Button
                            onClick={handleGeneratePlan}
                            disabled={isGeneratingPlan || !generatedParameters || highestStepReached > 2 || lockPreviousStepRegeneration}
                          >
                            {isGeneratingPlan ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {generatedPlan ? "Regenerate" : "Generate Composition Plan"}
                          </Button>
                          <Button onClick={handleProceedAfterPlan} disabled={!generatedPlan || isGeneratingPlan}>
                            Proceed To Next Step
                          </Button>
                        </div>
                      </div>

                      {generatedPlan ? (
                        <div className="mt-5 space-y-5">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plan Name</p>
                              <p className="mt-2 break-words text-base font-medium text-foreground">{generatedPlan.name}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Harmony</p>
                              <p className="mt-2 text-base font-medium text-foreground">
                                {generatedPlan.key} {generatedPlan.harmony.modeBase}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tempo</p>
                              <p className="mt-2 text-base font-medium text-foreground">{generatedPlan.bpm} BPM</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Structure</p>
                              <p className="mt-2 text-base font-medium text-foreground">
                                {generatedPlan.sections.length} sections
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Scale</p>
                              <p className="mt-2 break-words text-base font-medium text-foreground">
                                {generatedPlan.harmony.scale.join(" - ")}
                              </p>
                              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">Progression</p>
                              <p className="mt-2 break-words text-base font-medium text-foreground">
                                {generatedPlan.harmony.progression.join(" / ")}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plan Flags</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800">
                                  {generatedPlan.instrumental_only ? "Instrumental Only" : "Lyrics Included"}
                                </span>
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                                  {generatedPlan.loopable ? "Loopable" : "Non-loopable"}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                                  {generatedPlan.timeSignature}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {generatedPlan.sections.map((section) => (
                              <div key={section.section} className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,255,0.9))] p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                      {section.section}
                                    </p>
                                    <h3 className="mt-2 break-words text-xl text-foreground">
                                      {section.chord.name} over {section.bass}
                                    </h3>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                                      {section.modeColor}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                      {section.duration_ms.toLocaleString()} ms
                                    </span>
                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                                      {section.percussion}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Harmony</p>
                                    <p className="mt-2 text-sm text-foreground">Degree: {section.degree}</p>
                                    <p className="mt-1 break-words text-sm text-foreground">Chord Notes: {section.chord.notes.join(", ")}</p>
                                    <p className="mt-1 break-words text-sm text-foreground">Drone: {section.drone.join(", ")}</p>
                                  </div>
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Texture</p>
                                    <p className="mt-2 break-words text-sm text-foreground">Layers: {section.layers.join(", ")}</p>
                                    <p className="mt-1 text-sm text-foreground">Brightness: {section.brightness}</p>
                                    <p className="mt-1 text-sm text-foreground">Density: {section.density}</p>
                                    <p className="mt-1 text-sm text-foreground">Movement: {section.movement}</p>
                                  </div>
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Expression</p>
                                    <p className="mt-2 text-sm text-foreground">Filter: {section.expression.filterCutoffHz} Hz</p>
                                    <p className="mt-1 text-sm text-foreground">Note Density: {section.expression.noteDensity}</p>
                                    <p className="mt-1 text-sm text-foreground">Layers Count: {section.expression.layersCount}</p>
                                    <p className="mt-1 text-sm text-foreground">LFO Rate: {section.expression.lfoRateHz} Hz</p>
                                    <p className="mt-1 text-sm text-foreground">Register: {section.expression.register}</p>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                  {Object.entries(section.instruments).map(([category, instruments]) => (
                                    <div key={category} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        {formatLabel(category)}
                                      </p>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {instruments.length > 0 ? (
                                          instruments.map((instrument) => (
                                            <span key={instrument} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                                              {formatToolName(instrument)}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-sm text-muted-foreground">None</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm leading-6 text-muted-foreground">
                          No composition plan generated yet. Use the button above to run the Composition Planner step.
                        </div>
                      )}
                    </div>
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        ElevenLab Composition Plan
                      </p>
                      <p className="mt-2 text-lg font-medium text-foreground">
                        Create ElevenLabs compatible composition plan from the generated template
                      </p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        This step sends the generated composition planner output to ElevenLabs and displays the returned JSON response in a structured view.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            ElevenLab Response
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {lockPreviousStepRegeneration
                              ? "This saved session is read-only for steps 1 to 3."
                              : "Generate or regenerate the ElevenLabs composition plan from the step 2 template."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <Button
                            onClick={handleGenerateElevenLabsPlan}
                            disabled={isGeneratingElevenLabsPlan || !generatedPlan || highestStepReached > 3 || lockPreviousStepRegeneration}
                          >
                            {isGeneratingElevenLabsPlan ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {generatedElevenLabsPlan ? "Regenerate" : "Generate ElevenLab Plan"}
                          </Button>
                          <Button
                            onClick={handleProceedAfterElevenLabsPlan}
                            disabled={!generatedElevenLabsPlan || isGeneratingElevenLabsPlan}
                          >
                            Proceed To Next Step
                          </Button>
                        </div>
                      </div>

                      {generatedElevenLabsPlan ? (
                        <div className="mt-5 space-y-5">
                          <div className="flex flex-wrap gap-4">
                            <div className="min-w-[220px] max-w-full flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Positive Global Styles</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {generatedElevenLabsPlan.positive_global_styles.map((style) => (
                                  <span key={style} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800">
                                    {style}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="min-w-[220px] max-w-full flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Negative Global Styles</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {generatedElevenLabsPlan.negative_global_styles.map((style) => (
                                  <span key={style} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                                    {style}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="min-w-[160px] rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sections</p>
                              <p className="mt-2 text-base font-medium text-foreground">
                                {generatedElevenLabsPlan.sections.length}
                              </p>
                            </div>
                            <div className="min-w-[160px] rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                              <p className="mt-2 text-base font-medium text-foreground">
                                Plan Generated
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {generatedElevenLabsPlan.sections.map((section, index) => (
                              <div key={`${section.section_name}-${index}`} className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,255,0.9))] p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                      ElevenLabs Section
                                    </p>
                                    <h3 className="mt-2 break-words text-xl text-foreground">
                                      {section.section_name}
                                    </h3>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                      {section.duration_ms.toLocaleString()} ms
                                    </span>
                                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                                      {section.lines.length} lines
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Positive Local Styles</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {section.positive_local_styles.length > 0 ? (
                                        section.positive_local_styles.map((style) => (
                                          <span key={style} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800">
                                            {style}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-sm text-muted-foreground">None</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Negative Local Styles</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {section.negative_local_styles.length > 0 ? (
                                        section.negative_local_styles.map((style) => (
                                          <span key={style} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                                            {style}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-sm text-muted-foreground">None</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Full Response JSON</p>
                            <pre className="mt-3 max-h-[420px] overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-2xl bg-slate-950/95 p-4 text-xs leading-6 text-slate-100">
{JSON.stringify(generatedElevenLabsPlan, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm leading-6 text-muted-foreground">
                          No ElevenLab composition plan generated yet. Use the button above to create a composition plan from the ElevenLabs.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Generate Music
                      </p>
                      <p className="mt-2 text-lg font-medium text-foreground">
                        Generate track using the ElevenLabs composition plan
                      </p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        This final step uses the ElevenLabs Composition Plan from previous step, then lets you preview the audio and download the track.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Generated Music Output
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Generate the final audio from the ElevenLabs Composition Plan, then play or download it.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <Button
                            onClick={handleGenerateMusic}
                            disabled={isGeneratingMusic || !generatedElevenLabsPlan}
                          >
                            {isGeneratingMusic ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {generatedMusic ? "Regenerate Music" : "Generate Music"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleDownloadGeneratedMusic}
                            disabled={!generatedMusic}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {generatedMusic ? (
                        <div className="mt-5 space-y-5">
                          <div className="flex flex-wrap gap-4">
                            <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Format</p>
                              <p className="mt-2 text-base font-medium text-foreground">{generatedMusic.format}</p>
                            </div>
                            <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Duration</p>
                              <p className="mt-2 text-base font-medium text-foreground">{generatedMusic.duration}</p>
                            </div>
                            <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">File Size</p>
                              <p className="mt-2 text-base font-medium text-foreground">{generatedMusic.fileSize}</p>
                            </div>
                            <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Processing Time</p>
                              <p className="mt-2 text-base font-medium text-foreground">{generatedMusic.processingTime}</p>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,255,0.9))] p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Playback</p>
                                <p className="mt-2 text-lg font-medium text-foreground">
                                  {selectedTool ? formatToolName(selectedTool.id) : "Generated Track"}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <Button onClick={handleToggleGeneratedMusic}>
                                  {isPlayingGeneratedMusic ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                  {isPlayingGeneratedMusic ? "Pause" : "Play"}
                                </Button>
                                <label
                                  htmlFor="generated-music-loop"
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-foreground"
                                >
                                  <Checkbox
                                    id="generated-music-loop"
                                    checked={isGeneratedMusicLoopEnabled}
                                    onCheckedChange={(checked) => setIsGeneratedMusicLoopEnabled(checked === true)}
                                    aria-label="Loop generated track"
                                  />
                                  <span>Loop</span>
                                </label>
                              </div>
                            </div>
                            <audio
                              ref={audioRef}
                              className="mt-4 w-full"
                              src={generatedMusic.audioUrl}
                              controls
                              loop={isGeneratedMusicLoopEnabled}
                              onPlay={() => setIsPlayingGeneratedMusic(true)}
                              onPause={() => setIsPlayingGeneratedMusic(false)}
                              onEnded={() => setIsPlayingGeneratedMusic(false)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm leading-6 text-muted-foreground">
                          No music generated yet. Use the button above to create the final audio from the ElevenLabs Composition Plan.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
