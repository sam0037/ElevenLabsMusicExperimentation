import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Music2, Pause, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import meditationTools from "../../../music_composer_python/meditation_tool.json";
import type { MeditationTool, MusicTrackParameters } from "../../services/meditation-music-parameter-service";
import type { MusicCompositionPlan } from "../../services/music-composition-plan-service";
import type { CompositionPlanResponse } from "../../services/elevenlabs-service";
import {
  MyPrayersClubDownloadService,
  type MyPrayersClubTrackSummary,
} from "../../services/myprayersclub-download-service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { MyPrayersClubWorkflowDialog, type MyPrayersClubWorkflowSeed } from "./MyPrayersClubWorkflowDialog";
import { formatToolName } from "./myprayersclub-utils";

const TRACKS_PER_PAGE = 25;

function formatTimestamp(value: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

type DetailTrackResponse = {
  folderName: string;
  audioPath: string;
  parameters: unknown;
  compositionPlan: unknown;
  elevenLabsPlan: unknown;
  generatedMusic: unknown;
};

export function StudioPage() {
  const allTools = useMemo(
    () => [...meditationTools.somatic_tools, ...meditationTools.psychology_tools] as MeditationTool[],
    [],
  );
  const [tracks, setTracks] = useState<MyPrayersClubTrackSummary[]>([]);
  const [toolIds, setToolIds] = useState<string[]>([]);
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openingTrackFolder, setOpeningTrackFolder] = useState<string | null>(null);
  const [playingTrackFolder, setPlayingTrackFolder] = useState<string | null>(null);
  const [workflowSeed, setWorkflowSeed] = useState<MyPrayersClubWorkflowSeed | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTracks() {
      setLoading(true);
      try {
        const response = await MyPrayersClubDownloadService.listTracks(
          toolFilter === "all" ? undefined : toolFilter,
        );
        if (cancelled) {
          return;
        }
        setTracks(response.tracks);
        setToolIds(response.toolIds);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load Studio tracks");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTracks();
    return () => {
      cancelled = true;
    };
  }, [toolFilter]);

  useEffect(() => {
    setPage(1);
  }, [toolFilter, searchQuery]);

  const filteredTracks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return tracks;
    }

    return tracks.filter((track) => {
      const haystack = [
        track.songName,
        track.toolId,
        formatToolName(track.toolId),
        track.feeling,
        track.key,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, tracks]);

  const totalPages = Math.max(1, Math.ceil(filteredTracks.length / TRACKS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTracks = filteredTracks.slice(
    (currentPage - 1) * TRACKS_PER_PAGE,
    currentPage * TRACKS_PER_PAGE,
  );

  const handleToggleTrack = async (folderName: string) => {
    const audioElement = document.getElementById(`studio-audio-${folderName}`) as HTMLAudioElement | null;
    if (!audioElement) {
      return;
    }

    if (playingTrackFolder && playingTrackFolder !== folderName) {
      const previousAudio = document.getElementById(`studio-audio-${playingTrackFolder}`) as HTMLAudioElement | null;
      previousAudio?.pause();
    }

    if (audioElement.paused) {
      await audioElement.play();
      setPlayingTrackFolder(folderName);
      return;
    }

    audioElement.pause();
    setPlayingTrackFolder((current) => (current === folderName ? null : current));
  };

  const handleOpenTrack = async (track: MyPrayersClubTrackSummary) => {
    setOpeningTrackFolder(track.folderName);

    try {
      const response = await MyPrayersClubDownloadService.getTrack(track.folderName);
      const detail = response.track as DetailTrackResponse;
      setWorkflowSeed({
        key: `${track.folderName}-${track.generatedAt}`,
        selectedToolId: track.toolId,
        generatedParameters: detail.parameters as MusicTrackParameters,
        generatedPlan: detail.compositionPlan as MusicCompositionPlan,
        generatedElevenLabsPlan: detail.elevenLabsPlan as CompositionPlanResponse,
        generatedMusic: {
          audioBlob: null,
          audioUrl: `/${detail.audioPath}`,
          format: track.audioPath.split(".").pop()?.toUpperCase() ?? "MP3",
          duration: track.duration,
          fileSize: track.size,
          processingTime:
            typeof (detail.generatedMusic as { processingTime?: string })?.processingTime === "string"
              ? (detail.generatedMusic as { processingTime: string }).processingTime
              : "Saved Track",
        },
        currentStep: 4,
        highestStepReached: 4,
        lockPreviousStepRegeneration: true,
      });
      setIsModalOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open saved track");
    } finally {
      setOpeningTrackFolder(null);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_32%)]" />

        <div className="mx-auto mt-10 mb-10" style={{ width: '90%' }}>
          <div className="mx-auto flex flex-col gap-10 w-full">
            <section className="rounded-[2rem] border border-white/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,255,0.84))] p-8 shadow-[0_24px_80px_rgba(15,56,112,0.12)] backdrop-blur-xl md:p-10 mb-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/90 px-4 py-2 text-sm text-sky-800">
                    <Music2 className="h-4 w-4" />
                    <span>Saved Generation Studio</span>
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-4xl leading-tight text-foreground md:text-5xl">
                      Studio
                    </h1>
                    <p className="text-base leading-7 text-muted-foreground md:text-lg">
                      Browse every generated track saved in `data/myprayersclub_downloads`, filter by tool id, and reopen the final workflow step without duplicating the generation UI.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                    {tracks.length} tracks loaded
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                    {toolIds.length} tool ids
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/75 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,56,112,0.08)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Search</p>
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search song, tool, feeling, key..."
                      className="bg-white"
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Sorted by newest first. Showing {filteredTracks.length} matching tracks.
                </p>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,255,0.96))]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="px-4">SongName</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Feeling</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>BPM</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Loading Studio tracks...
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : paginatedTracks.length > 0 ? (
                      paginatedTracks.map((track) => (
                        <TableRow key={track.folderName}>
                          <TableCell className="px-4 font-medium text-foreground">{track.songName}</TableCell>
                          <TableCell>{formatToolName(track.toolId)}</TableCell>
                          <TableCell className="capitalize">{track.feeling}</TableCell>
                          <TableCell>{track.key}</TableCell>
                          <TableCell>{track.bpm ?? "N/A"}</TableCell>
                          <TableCell>{track.duration}</TableCell>
                          <TableCell>{track.size}</TableCell>
                          <TableCell>{formatTimestamp(track.generatedAt)}</TableCell>
                          <TableCell className="px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleToggleTrack(track.folderName)}
                              >
                                {playingTrackFolder === track.folderName ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                {playingTrackFolder === track.folderName ? "Pause" : "Play"}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => void handleOpenTrack(track)}
                                disabled={openingTrackFolder === track.folderName}
                              >
                                {openingTrackFolder === track.folderName ? (
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )}
                                Open
                              </Button>
                            </div>
                            <audio
                              id={`studio-audio-${track.folderName}`}
                              src={`/${track.audioPath}`}
                              onPlay={() => setPlayingTrackFolder(track.folderName)}
                              onPause={() => {
                                setPlayingTrackFolder((current) =>
                                  current === track.folderName ? null : current,
                                );
                              }}
                              onEnded={() => {
                                setPlayingTrackFolder((current) =>
                                  current === track.folderName ? null : current,
                                );
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                          No saved tracks match the current Studio filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </section>
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
