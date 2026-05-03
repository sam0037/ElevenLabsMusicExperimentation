import {
  Drum,
  Library,
  type LucideIcon,
  Music4,
  Sparkles,
  Waves,
  Waypoints,
} from "lucide-react";
import {
  INSTRUMENT_LIBRARY,
  type InstrumentCategory,
  type InstrumentProfile,
} from "../../services/music-composition-plan-service";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const CATEGORY_ORDER: InstrumentCategory[] = ["ambient", "melodic", "percussion", "texture", "others"];

const CATEGORY_META: Record<
  InstrumentCategory,
  {
    title: string;
    description: string;
    icon: LucideIcon;
    accentClassName: string;
  }
> = {
  ambient: {
    title: "Ambient",
    description: "Drones, pads, and sustained beds that create the emotional foundation.",
    icon: Waves,
    accentClassName: "from-sky-500/15 to-cyan-500/10 text-sky-900 border-sky-200/80",
  },
  melodic: {
    title: "Melodic",
    description: "Lead and supportive voices that carry the most expressive musical phrases.",
    icon: Music4,
    accentClassName: "from-emerald-500/15 to-lime-500/10 text-emerald-900 border-emerald-200/80",
  },
  percussion: {
    title: "Percussion",
    description: "Rhythmic instruments that add pulse, ritual movement, and gentle momentum.",
    icon: Drum,
    accentClassName: "from-amber-500/15 to-orange-500/10 text-amber-900 border-amber-200/80",
  },
  texture: {
    title: "Texture",
    description: "Atmospheric detail layers used for shimmer, motion, transitions, and space.",
    icon: Sparkles,
    accentClassName: "from-fuchsia-500/15 to-violet-500/10 text-fuchsia-900 border-fuchsia-200/80",
  },
  others: {
    title: "Others",
    description: "Support elements like low-end anchors and human-like backing layers.",
    icon: Waypoints,
    accentClassName: "from-slate-500/15 to-indigo-500/10 text-slate-900 border-slate-200/80",
  },
};

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMetric(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

function getProfileEntries(profile: InstrumentProfile, key: "targets" | "weights") {
  return Object.entries(profile[key]) as Array<[string, number]>;
}

export function InstrumentLibraryPage() {
  const groupedLibrary = CATEGORY_ORDER.map((category) => ({
    category,
    instruments: INSTRUMENT_LIBRARY
      .filter((profile) => profile.category === category)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  const uniqueTagsCount = new Set(INSTRUMENT_LIBRARY.flatMap((profile) => profile.tags)).size;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_32%)]" />

      <div className="mx-auto mt-10 mb-10" style={{ width: "90%" }}>
        <div className="mx-auto flex w-full flex-col gap-8">
          <section className="rounded-[2rem] border border-white/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,255,0.84))] p-8 shadow-[0_24px_80px_rgba(15,56,112,0.12)] backdrop-blur-xl md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50/90 px-4 py-2 text-sm text-sky-800">
                  <Library className="h-4 w-4" />
                  <span>Composition Instrument Library</span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl leading-tight text-foreground md:text-5xl">
                    Instrument library by category
                  </h1>
                  <p className="text-base leading-7 text-muted-foreground md:text-lg">
                    Explore every instrument available to the composition planner, grouped into
                    ambient, melodic, percussion, texture, and other support roles.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  {INSTRUMENT_LIBRARY.length} instruments
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  {CATEGORY_ORDER.length} categories
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                  {uniqueTagsCount} unique tags
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {groupedLibrary.map(({ category, instruments }) => {
                const meta = CATEGORY_META[category];
                const Icon = meta.icon;
                return (
                  <Button key={category} asChild variant="outline" size="sm">
                    <a href={`#${category}`}>
                      <Icon className="h-4 w-4" />
                      {meta.title} ({instruments.length})
                    </a>
                  </Button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-4">
              <Card className="bg-white/90">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">Base weight</CardTitle>
                  <CardDescription>
                    The starting preference for an instrument before any emotional matching happens.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-700">
                    In `scoreProfile()`, every instrument begins with `profile.baseWeight`. Higher
                    values make it more likely to rank well even before feature-by-feature scoring is added.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/90">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">Emotional targets</CardTitle>
                  <CardDescription>
                    The ideal emotional-state values an instrument is aiming to match.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-700">
                    The `targets` object defines preferred values on the planner’s emotional axes
                    (`v`, `a`, `b`, `t`, `d`, `m`). The current section state is compared against each target using `gaussianSimilarity()`.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/90">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">Matching weights</CardTitle>
                  <CardDescription>
                    Per-axis multipliers that control how strongly each target match affects ranking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-700">
                    In `scoreProfile()`, the planner adds `weight × similarity` for each feature.
                    A larger number means mismatches or matches on that axis matter more for the final score.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/90">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">How they are consumed</CardTitle>
                  <CardDescription>
                    The final category picks are based on total rank, not just one field alone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-700">
                    Total score = `baseWeight` + weighted target matches + tag bonus + category bonus
                    + optional feeling-bias bonus. Then `selectInstruments()` sorts each category by score
                    and keeps the top results allowed by `categoryQuota()`.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {groupedLibrary.map(({ category, instruments }) => {
            const meta = CATEGORY_META[category];
            const Icon = meta.icon;

            return (
              <section id={category} key={category} className="scroll-mt-24 space-y-4">
                <div
                  className={`rounded-[1.75rem] border bg-gradient-to-br p-6 shadow-[0_18px_45px_rgba(20,33,61,0.08)] ${meta.accentClassName}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-medium">
                        <Icon className="h-4 w-4" />
                        <span>{meta.title}</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold md:text-3xl">{meta.title} instruments</h2>
                        <p className="mt-1 max-w-3xl text-sm text-slate-700 md:text-base">{meta.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white/70 text-slate-800">
                      {instruments.length} entries
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {instruments.map((profile) => (
                    <Card key={profile.name} className="h-full bg-white/90">
                      <CardHeader className="gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-xl">{formatLabel(profile.name)}</CardTitle>
                            <CardDescription className="mt-1">
                              {meta.title} • base weight {profile.baseWeight.toFixed(2)}
                            </CardDescription>
                          </div>
                          <Badge className="capitalize">{profile.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Tags
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {profile.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="bg-slate-50">
                                {formatLabel(tag)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Emotional targets
                            </p>
                            <ul className="space-y-1.5 text-sm text-slate-700">
                              {getProfileEntries(profile, "targets").map(([key, value]) => (
                                <li key={key} className="flex items-center justify-between gap-2">
                                  <span className="uppercase text-slate-500">{key}</span>
                                  <span className="font-medium">{formatMetric(value)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Matching weights
                            </p>
                            <ul className="space-y-1.5 text-sm text-slate-700">
                              {getProfileEntries(profile, "weights").map(([key, value]) => (
                                <li key={key} className="flex items-center justify-between gap-2">
                                  <span className="uppercase text-slate-500">{key}</span>
                                  <span className="font-medium">{value.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
