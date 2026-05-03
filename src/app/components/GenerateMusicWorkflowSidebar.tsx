type WorkflowStep = {
  id: 1 | 2 | 3 | 4;
  label: string;
};

type GenerateMusicWorkflowSidebarProps = {
  steps: WorkflowStep[];
  currentStep: 1 | 2 | 3 | 4;
  highestStepReached: 1 | 2 | 3 | 4;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
};

export function GenerateMusicWorkflowSidebar({
  steps,
  currentStep,
  highestStepReached,
  onSelectStep,
}: GenerateMusicWorkflowSidebarProps) {
  return (
    <aside className="sticky top-0 max-h-[calc(90vh-220px)] self-start overflow-y-auto rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(236,247,255,0.92),rgba(242,248,255,0.9))] p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.28em] text-sky-800/80">
        Workflow
      </p>

      <div className="mt-4 space-y-3">
        {steps.map((step) => {
          const isCurrent = currentStep === step.id;
          const isAvailable = step.id <= highestStepReached;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isAvailable && onSelectStep(step.id)}
              disabled={!isAvailable}
              className={`block w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                isCurrent
                  ? "border-sky-300 bg-white text-sky-900 shadow-[0_10px_24px_rgba(14,165,233,0.12)]"
                  : isAvailable
                    ? "border-white/80 bg-white/85 text-foreground hover:border-sky-200 hover:bg-white"
                    : "border-dashed border-slate-200 bg-transparent text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm ${isCurrent ? "font-semibold" : "font-medium"}`}>
                  {step.id}. {step.label}
                </span>
                {isCurrent ? (
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-800">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="inline">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                      <circle cx="6" cy="6" r="2" fill="currentColor" />
                    </svg>
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
