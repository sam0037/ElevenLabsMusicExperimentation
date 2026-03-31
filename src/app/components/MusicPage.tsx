import { useState, useEffect, useRef } from "react";
import { Play, Pause, FileAudio, Sparkles, Music2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { ElevenLabsService, CompositionPlanResponse } from "../../services/elevenlabs-service";
import { isElevenLabsConfigured, isOpenAIConfigured } from "../../config/api-config";
import { HistoryService } from "../../services/history-service";
import { OpenAIService } from "../../services/openai-service";

interface CompositionPlan {
  id: string;
  title?: string;
  prompt: string;
  plan: string;
  timestamp: number;
  requestMetadata: {
    prompt: string;
    model?: string;
    duration?: string;
  };
  responseMetadata: {
    planId: string;
    tokensUsed?: number;
    processingTime?: string;
    confidence?: number;
  };
  apiResponse?: CompositionPlanResponse; // Store the actual API response for generating music
}

interface MusicGeneration {
  id: string;
  prompt: string;
  compositionPlanId?: string;
  audioUrl: string;
  audioPath?: string;
  timestamp: number;
  requestMetadata: {
    prompt: string;
    type: "from_prompt" | "from_plan";
    model?: string;
    duration?: string;
  };
  responseMetadata: {
    audioId: string;
    format?: string;
    duration?: string;
    fileSize?: string;
    processingTime?: string;
  };
}

export function MusicPage() {
  const [compositionPrompt, setCompositionPrompt] = useState("");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [compositionPlans, setCompositionPlans] = useState<CompositionPlan[]>([]);
  const [musicGenerations, setMusicGenerations] = useState<MusicGeneration[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [expandedPlanDetails, setExpandedPlanDetails] = useState<string | null>(null);
  const [expandedMusicDetails, setExpandedMusicDetails] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const generatingPlanTitleIds = useRef<Set<string>>(new Set());

  const getPlanTitle = (plan: CompositionPlan) => {
    if (plan.title?.trim()) {
      return plan.title;
    }
    return plan.prompt.slice(0, 60) || "Untitled Plan";
  };

  const getMusicTitle = (music: MusicGeneration) => {
    return music.prompt.slice(0, 60) || "Untitled Track";
  };

  const generatePlanTitle = async (prompt: string, planBody: string) => {
    if (!isOpenAIConfigured()) {
      return prompt.slice(0, 50);
    }
    try {
      const openaiService = new OpenAIService();
      const generated = await openaiService.generateTitle(
        `${prompt}\n\n${planBody}`,
        "plan"
      );
      return generated || prompt.slice(0, 50);
    } catch (error) {
      console.error("Failed to generate plan title:", error);
      return prompt.slice(0, 50);
    }
  };

  // Load from local repo storage (with localStorage fallback) or use mock data
  useEffect(() => {
    let isMounted = true;

    const mockPlans: CompositionPlan[] = [
        {
          id: "mock-plan-1",
          title: "Uplifting Synth Drive",
          prompt: "An uplifting electronic track with synths and drums",
          plan: "Genre: Electronic\nMood: Uplifting, Energetic\nTempo: 128 BPM\nKey: C Major\nDuration: 2 minutes 30 seconds\n\nInstruments:\n- Lead Synthesizer (bright, melodic)\n- Bass Synthesizer (punchy, rhythmic)\n- Electronic Drums (kick, snare, hi-hats)\n- Pad Synths (atmospheric background)\n\nStructure:\n- Intro (0:00-0:15): Atmospheric pads with light percussion\n- Build-up (0:15-0:30): Introduction of bass and drums\n- Main Section (0:30-1:30): Full arrangement with lead melody\n- Breakdown (1:30-1:45): Reduced to pads and light percussion\n- Final Build (1:45-2:00): Gradual reintroduction of elements\n- Outro (2:00-2:30): Fade out with main melody",
          timestamp: Date.now() - 3600000,
          requestMetadata: {
            prompt: "An uplifting electronic track with synths and drums",
            model: "eleven-music-v1",
            duration: "medium",
          },
          responseMetadata: {
            planId: "plan_abc123def456",
            tokensUsed: 1247,
            processingTime: "3.2s",
            confidence: 0.94,
          },
        },
        {
          id: "mock-plan-2",
          title: "Calm Ambient Drift",
          prompt: "Calm ambient music for meditation",
          plan: "Genre: Ambient\nMood: Calm, Peaceful, Meditative\nTempo: 60 BPM\nKey: A Minor\nDuration: 3 minutes\n\nInstruments:\n- Soft Pad Synths (warm, evolving)\n- Ethereal Voices (wordless, atmospheric)\n- Subtle Bell Tones (occasional accents)\n- Deep Bass Drone (grounding)\n\nStructure:\n- Opening (0:00-0:30): Gentle pad fade-in\n- Development (0:30-2:30): Slow evolution of textures\n- Resolution (2:30-3:00): Gradual fade to silence\n\nProduction Notes:\n- Use reverb generously for spaciousness\n- Keep dynamics minimal for relaxation\n- Avoid sudden changes or jarring elements",
          timestamp: Date.now() - 7200000,
          requestMetadata: {
            prompt: "Calm ambient music for meditation",
            model: "eleven-music-v1",
            duration: "medium",
          },
          responseMetadata: {
            planId: "plan_xyz789ghi012",
            tokensUsed: 986,
            processingTime: "2.8s",
            confidence: 0.91,
          },
        },
      ];

    const mockMusic: MusicGeneration[] = [
        {
          id: "mock-music-1",
          prompt: "Upbeat pop song with catchy melody",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          timestamp: Date.now() - 1800000,
          requestMetadata: {
            prompt: "Upbeat pop song with catchy melody",
            type: "from_prompt",
            model: "eleven-music-v1",
            duration: "short",
          },
          responseMetadata: {
            audioId: "audio_pop123abc",
            format: "mp3",
            duration: "2:45",
            fileSize: "4.2 MB",
            processingTime: "12.5s",
          },
        },
        {
          id: "mock-music-2",
          prompt: "From plan: An uplifting electronic track with synths and drums",
          compositionPlanId: "mock-plan-1",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          timestamp: Date.now() - 3000000,
          requestMetadata: {
            prompt: "An uplifting electronic track with synths and drums",
            type: "from_plan",
            model: "eleven-music-v1",
            duration: "medium",
          },
          responseMetadata: {
            audioId: "audio_elec456def",
            format: "mp3",
            duration: "2:30",
            fileSize: "3.8 MB",
            processingTime: "15.3s",
          },
        },
        {
          id: "mock-music-3",
          prompt: "Jazz piano solo with smooth improvisation",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          timestamp: Date.now() - 5400000,
          requestMetadata: {
            prompt: "Jazz piano solo with smooth improvisation",
            type: "from_prompt",
            model: "eleven-music-v1",
            duration: "medium",
          },
          responseMetadata: {
            audioId: "audio_jazz789ghi",
            format: "mp3",
            duration: "3:15",
            fileSize: "5.1 MB",
            processingTime: "18.7s",
          },
        },
      ];

    const loadHistory = async () => {
      const [storedPlans, storedMusic] = await Promise.all([
        HistoryService.loadCompositionPlans<CompositionPlan>(),
        HistoryService.loadMusicGenerations<MusicGeneration>(),
      ]);

      if (!isMounted) {
        return;
      }

      if (storedPlans) {
        setCompositionPlans(storedPlans);
      } else {
        setCompositionPlans(mockPlans);
      }

      if (storedMusic) {
        setMusicGenerations(storedMusic);
      } else {
        setMusicGenerations(mockMusic);
      }

      setHasLoadedHistory(true);
    };

    loadHistory().catch(() => {
      if (!isMounted) {
        return;
      }
      setCompositionPlans(mockPlans);
      setMusicGenerations(mockMusic);
      setHasLoadedHistory(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save to local repo storage
  useEffect(() => {
    if (!hasLoadedHistory) {
      return;
    }
    HistoryService.saveCompositionPlans(compositionPlans).catch((error) => {
      console.error("Failed to save composition plans:", error);
    });
  }, [compositionPlans, hasLoadedHistory]);

  useEffect(() => {
    if (!hasLoadedHistory) {
      return;
    }
    HistoryService.saveMusicGenerations(musicGenerations).catch((error) => {
      console.error("Failed to save music generations:", error);
    });
  }, [musicGenerations, hasLoadedHistory]);

  // Backfill titles for older plans using OpenAI.
  useEffect(() => {
    if (!hasLoadedHistory || !isOpenAIConfigured()) {
      return;
    }

    const candidate = compositionPlans.find(
      p => (!p.title || !p.title.trim()) && !generatingPlanTitleIds.current.has(p.id)
    );

    if (!candidate) {
      return;
    }

    generatingPlanTitleIds.current.add(candidate.id);
    generatePlanTitle(candidate.prompt, candidate.plan)
      .then((title) => {
        if (!title) {
          return;
        }
        setCompositionPlans(prev =>
          prev.map(p =>
            p.id === candidate.id
              ? { ...p, title }
              : p
          )
        );
      })
      .catch((error) => {
        console.error("Failed to backfill plan title:", error);
      })
      .finally(() => {
        generatingPlanTitleIds.current.delete(candidate.id);
      });
  }, [compositionPlans, hasLoadedHistory]);

  const createCompositionPlan = async () => {
    if (!compositionPrompt.trim()) return;

    setIsGeneratingPlan(true);

    // Simulate API call to Eleven Labs
    // In production, this would call your backend:
    // const response = await fetch('/api/music/composition-plan', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     prompt: compositionPrompt,
    //     api_key: 'YOUR_ELEVEN_LABS_API_KEY'
    //   })
    // });

    if (isElevenLabsConfigured()) {
      try {
        const elevenLabsService = new ElevenLabsService();
        const response = await elevenLabsService.createCompositionPlan(compositionPrompt);
        const planId = `plan_${Date.now()}`;
        const title = await generatePlanTitle(compositionPrompt, response.plan);
        const newPlan: CompositionPlan = {
          id: Date.now().toString(),
          title,
          prompt: compositionPrompt,
          plan: response.plan,
          timestamp: Date.now(),
          requestMetadata: {
            prompt: compositionPrompt,
            model: "eleven-music-v1",
            duration: "medium",
          },
          responseMetadata: {
            planId: planId,
            tokensUsed: response.tokensUsed,
            processingTime: response.processingTime,
            confidence: response.confidence,
          },
          apiResponse: response, // Store the actual API response
        };

        setCompositionPlans(prev => [newPlan, ...prev]);
        setCompositionPrompt("");
        setIsGeneratingPlan(false);
        toast.success("Composition plan created");
      } catch (error) {
        console.error("Error creating composition plan:", error);
        toast.error("Failed to create composition plan");
        setIsGeneratingPlan(false);
      }
    } else {
      setTimeout(() => {
        const buildMockPlan = async () => {
        const planId = `plan_${Date.now()}`;
        const mockPlanContent = `This is a mock composition plan for: "${compositionPrompt}"\n\nTo enable real composition plan generation:\n\n1. Set up a backend server (or Supabase Edge Functions)\n2. Add your Eleven Labs API key\n3. Call the Eleven Labs API:\n   POST https://api.elevenlabs.io/v1/music/composition-plan\n4. Return the composition plan to the frontend\n\nExample plan structure:\n- Genre: Electronic\n- Mood: Uplifting\n- Tempo: 128 BPM\n- Key: C Major\n- Duration: 2 minutes\n- Instruments: Synths, drums, bass`;
        const title = await generatePlanTitle(compositionPrompt, mockPlanContent);
        const newPlan: CompositionPlan = {
          id: Date.now().toString(),
          title,
          prompt: compositionPrompt,
          plan: mockPlanContent,
          timestamp: Date.now(),
          requestMetadata: {
            prompt: compositionPrompt,
            model: "eleven-music-v1",
            duration: "medium",
          },
          responseMetadata: {
            planId: planId,
            tokensUsed: Math.floor(Math.random() * 500) + 800,
            processingTime: `${(Math.random() * 3 + 1).toFixed(1)}s`,
            confidence: parseFloat((Math.random() * 0.1 + 0.85).toFixed(2)),
          },
        };

        setCompositionPlans(prev => [newPlan, ...prev]);
        setCompositionPrompt("");
        setIsGeneratingPlan(false);
        toast.success("Composition plan created");
        };

        buildMockPlan().catch((error) => {
          console.error("Error creating mock composition plan:", error);
          setIsGeneratingPlan(false);
          toast.error("Failed to create composition plan");
        });
      }, 1500);
    }
  };

  const generateMusic = async (useCompositionPlan: boolean = false) => {
    const prompt = useCompositionPlan && selectedPlanId
      ? compositionPlans.find(p => p.id === selectedPlanId)?.prompt || ""
      : musicPrompt;

    if (!prompt.trim()) {
      toast.error("Please enter a prompt or select a composition plan");
      return;
    }

    setIsGeneratingMusic(true);

    // Simulate API call to Eleven Labs
    // In production:
    // const response = await fetch('/api/music/generate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     prompt: prompt,
    //     composition_plan: useCompositionPlan ? prompt : undefined,
    //     api_key: 'YOUR_ELEVEN_LABS_API_KEY'
    //   })
    // });

    if (isElevenLabsConfigured()) {
      try {
        const elevenLabsService = new ElevenLabsService();
        const planResponse = useCompositionPlan && selectedPlanId
          ? compositionPlans.find(p => p.id === selectedPlanId)?.apiResponse
          : undefined;
        const response = await elevenLabsService.generateMusic(prompt, planResponse);
        const audioId = `audio_${Date.now()}`;
        const persistedAudio = await HistoryService.persistAudioBlob(
          response.audioBlob,
          audioId
        );
        
        const newMusic: MusicGeneration = {
          id: Date.now().toString(),
          prompt: useCompositionPlan ? `From plan: ${prompt}` : musicPrompt,
          compositionPlanId: useCompositionPlan ? selectedPlanId || undefined : undefined,
          audioUrl: persistedAudio.audioUrl,
          audioPath: persistedAudio.audioPath,
          timestamp: Date.now(),
          requestMetadata: {
            prompt: prompt,
            type: useCompositionPlan ? "from_plan" : "from_prompt",
            model: "eleven-music-v1",
            duration: "medium",
          },
          responseMetadata: {
            audioId: audioId,
            format: response.format,
            duration: response.duration,
            fileSize: response.fileSize,
            processingTime: response.processingTime,
          },
        };

        setMusicGenerations(prev => [newMusic, ...prev]);
        if (!useCompositionPlan) {
          setMusicPrompt("");
        }
        setIsGeneratingMusic(false);
        toast.success("Music generated successfully");
      } catch (error) {
        console.error("Error generating music:", error);
        toast.error("Failed to generate music");
        setIsGeneratingMusic(false);
      }
    } else {
      setTimeout(() => {
        // Mock audio URLs - cycle through different SoundHelix tracks
        const audioUrls = [
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        ];
        const mockAudioUrl = audioUrls[Math.floor(Math.random() * audioUrls.length)];
        const audioId = `audio_${Date.now()}`;
        
        const newMusic: MusicGeneration = {
          id: Date.now().toString(),
          prompt: useCompositionPlan ? `From plan: ${prompt}` : musicPrompt,
          compositionPlanId: useCompositionPlan ? selectedPlanId || undefined : undefined,
          audioUrl: mockAudioUrl,
          timestamp: Date.now(),
          requestMetadata: {
            prompt: prompt,
            type: useCompositionPlan ? "from_plan" : "from_prompt",
            model: "eleven-music-v1",
            duration: "medium",
          },
          responseMetadata: {
            audioId: audioId,
            format: "mp3",
            duration: `${Math.floor(Math.random() * 2 + 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            fileSize: `${(Math.random() * 3 + 2).toFixed(1)} MB`,
            processingTime: `${(Math.random() * 10 + 10).toFixed(1)}s`,
          },
        };

        setMusicGenerations(prev => [newMusic, ...prev]);
        if (!useCompositionPlan) {
          setMusicPrompt("");
        }
        setIsGeneratingMusic(false);
        toast.success("Music generated successfully");
      }, 2000);
    }
  };

  const togglePlay = (id: string) => {
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(id);
    }
  };

  const togglePlanDetails = (id: string) => {
    setExpandedPlanDetails(expandedPlanDetails === id ? null : id);
  };

  const toggleMusicDetails = (id: string) => {
    setExpandedMusicDetails(expandedMusicDetails === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 rounded-3xl border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(238,247,255,0.88)_55%,rgba(255,244,224,0.9))] px-6 py-5 shadow-[0_22px_45px_rgba(20,33,61,0.08)] backdrop-blur-sm">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Eleven Labs Music Generation</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Create composition plans and generate music using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Composition Plan Generator */}
        <Card className="p-6 border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(233,245,255,0.92))]">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(219,234,254,1),rgba(186,230,253,0.95))] text-primary shadow-[0_10px_20px_rgba(15,108,189,0.12)]">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Create Composition Plan</h2>
          </div>
          <Textarea
            value={compositionPrompt}
            onChange={(e) => setCompositionPrompt(e.target.value)}
            placeholder="Describe the music you want to create... (e.g., 'An uplifting electronic track with synths and drums')"
            className="mb-4 min-h-[120px]"
            disabled={isGeneratingPlan}
          />
          <Button
            onClick={createCompositionPlan}
            disabled={isGeneratingPlan || !compositionPrompt.trim()}
            className="w-full rounded-2xl border-0 bg-[linear-gradient(135deg,#2563eb_0%,#0891b2_52%,#38bdf8_100%)] text-white shadow-[0_18px_36px_rgba(14,116,214,0.28)] hover:shadow-[0_22px_42px_rgba(14,116,214,0.34)] disabled:bg-[linear-gradient(135deg,rgba(37,99,235,0.78)_0%,rgba(56,189,248,0.78)_100%)] disabled:text-white/90 disabled:shadow-[0_12px_28px_rgba(14,116,214,0.18)]"
          >
            {isGeneratingPlan ? "Generating..." : "Generate Composition Plan"}
          </Button>
        </Card>

        {/* Music Generator */}
        <Card className="p-6 border-orange-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,243,223,0.9))]">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,237,213,1),rgba(254,215,170,0.95))] text-accent-foreground shadow-[0_10px_20px_rgba(249,115,22,0.14)]">
              <Music2 className="w-5 h-5 text-accent-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Generate Music</h2>
          </div>
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="prompt">From Prompt</TabsTrigger>
              <TabsTrigger value="plan">From Plan</TabsTrigger>
            </TabsList>
            <TabsContent value="prompt" className="space-y-4">
              <Textarea
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="Describe the music directly..."
                className="min-h-[90px]"
                disabled={isGeneratingMusic}
              />
              <Button
                onClick={() => generateMusic(false)}
                disabled={isGeneratingMusic || !musicPrompt.trim()}
                className="w-full rounded-xl"
              >
                {isGeneratingMusic ? "Generating..." : "Generate Music"}
              </Button>
            </TabsContent>
            <TabsContent value="plan" className="space-y-4">
              <div className="mb-4 min-h-[90px]">
                {compositionPlans.length > 0 ? (
                  <ScrollArea className="h-[90px] rounded-2xl border border-orange-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,247,236,0.9))] p-2 shadow-inner">
                    <div className="space-y-2">
                      {compositionPlans.map(plan => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`rounded-xl border px-3 py-2 cursor-pointer text-sm font-medium transition-all ${
                            selectedPlanId === plan.id
                              ? "border-orange-200/50 bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_55%,#fb7185_100%)] text-white shadow-[0_12px_24px_rgba(249,115,22,0.24)]"
                              : "border-transparent bg-white/75 text-foreground hover:border-orange-200/70 hover:bg-white"
                          }`}
                        >
                          {getPlanTitle(plan)}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[90px] border rounded-md flex items-center justify-center text-sm text-muted-foreground">
                    No composition plans yet
                  </div>
                )}
              </div>
              <Button
                onClick={() => generateMusic(true)}
                disabled={isGeneratingMusic || !selectedPlanId}
                className="w-full rounded-2xl border-0 bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_52%,#ef4444_100%)] text-white shadow-[0_18px_36px_rgba(249,115,22,0.24)] hover:shadow-[0_22px_42px_rgba(249,115,22,0.3)] disabled:bg-[linear-gradient(135deg,rgba(245,158,11,0.78)_0%,rgba(239,68,68,0.78)_100%)] disabled:text-white/90 disabled:shadow-[0_12px_28px_rgba(249,115,22,0.16)]"
              >
                {isGeneratingMusic ? "Generating..." : "Generate from Plan"}
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* History Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composition Plans History */}
        <Card className="p-6 border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(238,246,255,0.94))]">
          <h2 className="text-lg font-semibold mb-4">Composition Plans History</h2>
          <ScrollArea className="h-[400px]">
            {compositionPlans.length > 0 ? (
              <div className="space-y-4">
                {compositionPlans.map(plan => (
                  <Card key={plan.id} className="gap-4 border-primary/10 bg-white/88 p-4 shadow-[0_10px_25px_rgba(20,33,61,0.06)]">
                    <div className="space-y-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlanDetails(plan.id)}
                        className="h-auto w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 hover:border-primary/10 hover:bg-secondary/60"
                      >
                        <div className="text-left">
                          <p className="text-sm font-semibold text-foreground">{getPlanTitle(plan)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(plan.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {expandedPlanDetails === plan.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>

                      {expandedPlanDetails === plan.id && (
                        <div className="space-y-3 border-t border-primary/10 pt-3">
                          <div>
                            <p className="text-xs font-semibold mb-1">Plan Prompt:</p>
                            <p className="rounded-xl border border-primary/10 bg-secondary/35 p-3 text-xs text-foreground whitespace-pre-wrap">
                              {plan.prompt}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1">Plan Content:</p>
                            <p className="rounded-xl border border-primary/10 bg-white p-3 text-xs text-foreground whitespace-pre-wrap">
                              {plan.plan}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1">Input Request:</p>
                            <div className="rounded-xl border border-primary/10 bg-secondary/35 p-3 text-xs text-foreground space-y-1">
                              <p><span className="font-medium">Prompt:</span> {plan.requestMetadata.prompt}</p>
                              <p><span className="font-medium">Model:</span> {plan.requestMetadata.model}</p>
                              <p><span className="font-medium">Duration:</span> {plan.requestMetadata.duration}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1">Output Response:</p>
                            <div className="rounded-xl border border-primary/10 bg-accent/25 p-3 text-xs text-foreground space-y-1">
                              <p><span className="font-medium">Plan ID:</span> {plan.responseMetadata.planId}</p>
                              <p><span className="font-medium">Tokens Used:</span> {plan.responseMetadata.tokensUsed}</p>
                              <p><span className="font-medium">Processing Time:</span> {plan.responseMetadata.processingTime}</p>
                              <p><span className="font-medium">Confidence:</span> {(plan.responseMetadata.confidence! * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">No composition plans yet</p>
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Music Generations History */}
        <Card className="p-6 border-orange-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,235,0.92))]">
          <h2 className="text-lg font-semibold mb-4">Generated Music History</h2>
          <ScrollArea className="h-[400px]">
            {musicGenerations.length > 0 ? (
              <div className="space-y-4">
                {musicGenerations.map(music => (
                  <Card key={music.id} className="gap-4 border-primary/10 bg-white/88 p-4 shadow-[0_10px_25px_rgba(20,33,61,0.06)]">
                    <div className="space-y-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMusicDetails(music.id)}
                        className="h-auto w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 hover:border-primary/10 hover:bg-secondary/60"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <FileAudio className="h-4 w-4 text-primary flex-shrink-0" />
                            <p className="text-sm font-semibold truncate">{getMusicTitle(music)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(music.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {expandedMusicDetails === music.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>

                      {expandedMusicDetails === music.id && (
                        <div className="space-y-3 border-t border-primary/10 pt-3">
                          <div className="flex items-start gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-shrink-0 rounded-xl"
                              onClick={() => togglePlay(music.id)}
                            >
                              {currentlyPlaying === music.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <div className="flex-1 min-w-0">
                              {currentlyPlaying === music.id && (
                                <div>
                                  <audio
                                    src={music.audioUrl}
                                    controls
                                    autoPlay
                                    className="w-full"
                                    onEnded={() => setCurrentlyPlaying(null)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1">Input Request:</p>
                            <div className="rounded-xl border border-primary/10 bg-secondary/35 p-3 text-xs text-foreground space-y-1">
                              <p><span className="font-medium">Prompt:</span> {music.requestMetadata.prompt}</p>
                              <p><span className="font-medium">Type:</span> {music.requestMetadata.type === "from_plan" ? "From Plan" : "From Prompt"}</p>
                              <p><span className="font-medium">Model:</span> {music.requestMetadata.model}</p>
                              <p><span className="font-medium">Duration:</span> {music.requestMetadata.duration}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-1">Output Response:</p>
                            <div className="rounded-xl border border-primary/10 bg-accent/25 p-3 text-xs text-foreground space-y-1">
                              <p><span className="font-medium">Audio ID:</span> {music.responseMetadata.audioId}</p>
                              <p><span className="font-medium">Format:</span> {music.responseMetadata.format}</p>
                              <p><span className="font-medium">Duration:</span> {music.responseMetadata.duration}</p>
                              <p><span className="font-medium">File Size:</span> {music.responseMetadata.fileSize}</p>
                              <p><span className="font-medium">Processing Time:</span> {music.responseMetadata.processingTime}</p>
                              <p><span className="font-medium">Local File:</span> {music.audioPath || "Not persisted"}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">No music generated yet</p>
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
