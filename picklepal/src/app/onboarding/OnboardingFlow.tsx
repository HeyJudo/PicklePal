"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Link2,
  Check,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { checkSlugAvailability, createGroup } from "./actions";

type Step = "name" | "slug" | "players";

const STEPS: Step[] = ["name", "slug", "players"];

export default function OnboardingFlow() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentStep, setCurrentStep] = useState<Step>("name");
  const [groupName, setGroupName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }, []);

  const handleNameChange = (value: string) => {
    setGroupName(value);
    setError(null);
    const suggested = generateSlug(value);
    if (suggested) {
      setSlug(suggested);
      setSlugStatus("idle");
      setSlugError(null);
    }
  };

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    setSlug(clean);
    setSlugStatus("idle");
    setSlugError(null);
    setError(null);
  };

  const handleCheckSlug = async () => {
    if (!slug || slug.length < 3) return;
    setSlugStatus("checking");
    const result = await checkSlugAvailability(slug);
    if (result.available) {
      setSlugStatus("available");
      setSlugError(null);
    } else {
      setSlugStatus("taken");
      setSlugError(result.error ?? "Not available");
    }
  };

  const handlePlayerChange = (index: number, value: string) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError(null);
  };

  const handleAddPlayer = () => {
    if (players.length < 20) {
      setPlayers((prev) => [...prev, ""]);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const canAdvance = (): boolean => {
    switch (currentStep) {
      case "name":
        return groupName.trim().length >= 2;
      case "slug":
        return slug.length >= 3 && slugStatus === "available";
      case "players":
        return players.filter((p) => p.trim().length > 0).length >= 2;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === "name" && groupName.trim().length < 2) {
      setError("Give your group a name (at least 2 characters)");
      return;
    }
    if (currentStep === "slug" && slugStatus !== "available") {
      setError("Check that your URL is available first");
      return;
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    setError(null);
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleSubmit = () => {
    const validPlayers = players.filter((p) => p.trim().length > 0);
    if (validPlayers.length < 2) {
      setError("Add at least 2 players to get started");
      return;
    }

    startTransition(async () => {
      const result = await createGroup({
        name: groupName.trim(),
        slug,
        players: validPlayers,
      });

      if (result.success && result.slug) {
        router.push(`/g/${result.slug}`);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-surface-container-high">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <span className="font-headline text-lg font-bold text-on-background">
            DinkDay
          </span>
          <span className="text-xs text-on-surface-variant">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-24">
        <div className="w-full max-w-lg">
          {/* Step: Name */}
          {currentStep === "name" && (
            <div>
              <div className="mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-headline text-2xl font-bold text-on-background">
                  Welcome to DinkDay
                </h2>
                <p className="mt-2 text-on-surface-variant">
                  Let&apos;s set up your pickleball group. What do you call your crew?
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="group-name"
                  className="text-sm font-medium text-on-background"
                >
                  Group name
                </label>
                <input
                  id="group-name"
                  type="text"
                  value={groupName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canAdvance() && handleNext()}
                  placeholder="e.g., Sunday Court Crew"
                  maxLength={50}
                  autoFocus
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-on-background placeholder:text-text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-on-surface-variant">
                  This is what your group members will see. You can change it later.
                </p>
              </div>
            </div>
          )}

          {/* Step: Slug */}
          {currentStep === "slug" && (
            <div>
              <div className="mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-headline text-2xl font-bold text-on-background">
                  Choose your URL
                </h2>
                <p className="mt-2 text-on-surface-variant">
                  This is how people will find your group. Pick something short and memorable.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="group-slug"
                  className="text-sm font-medium text-on-background"
                >
                  Group URL
                </label>
                <div className="flex items-center gap-0 rounded-lg border border-border bg-surface overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
                  <span className="shrink-0 bg-surface-container-high px-3 py-3 text-sm text-on-surface-variant border-r border-border">
                    dinkday.app/g/
                  </span>
                  <input
                    id="group-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    onBlur={handleCheckSlug}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCheckSlug();
                      }
                    }}
                    placeholder="your-crew"
                    maxLength={40}
                    autoFocus
                    className="flex-1 bg-transparent px-3 py-3 text-on-background placeholder:text-text-muted outline-none"
                  />
                  {slugStatus === "checking" && (
                    <div className="pr-3">
                      <Loader2 className="h-4 w-4 text-on-surface-variant animate-spin" />
                    </div>
                  )}
                  {slugStatus === "available" && (
                    <div className="pr-3">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  {slugStatus === "taken" && (
                    <div className="pr-3">
                      <X className="h-4 w-4 text-error" />
                    </div>
                  )}
                </div>
                {slugStatus === "available" && (
                  <p className="text-xs text-primary font-medium">
                    This URL is available
                  </p>
                )}
                {slugError && (
                  <p className="text-xs text-error">{slugError}</p>
                )}
                {slugStatus === "idle" && slug.length >= 3 && (
                  <p className="text-xs text-on-surface-variant">
                    Press Enter or click away to check availability
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step: Players */}
          {currentStep === "players" && (
            <div>
              <div className="mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-headline text-2xl font-bold text-on-background">
                  Add your crew
                </h2>
                <p className="mt-2 text-on-surface-variant">
                  Who plays with you? Just first names are fine — you can always add more later.
                </p>
              </div>

              <div className="space-y-3">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        backgroundColor: [
                          "#2D8B4E", "#2196F3", "#F5C518", "#FF6B35",
                          "#9C27B0", "#E53935", "#00BCD4", "#4CAF50",
                          "#FF9800", "#3F51B5", "#795548", "#607D8B",
                          "#8BC34A", "#CDDC39", "#009688", "#673AB7",
                          "#FFC107", "#03A9F4", "#FF5722", "#9E9E9E",
                        ][index % 20],
                      }}
                    >
                      {player.trim() ? player.trim()[0].toUpperCase() : (index + 1)}
                    </div>
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => handlePlayerChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && index === players.length - 1) {
                          handleAddPlayer();
                        }
                      }}
                      placeholder={`Player ${index + 1}`}
                      maxLength={30}
                      autoFocus={index === 0}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-on-background placeholder:text-text-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {players.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(index)}
                        className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
                        aria-label={`Remove player ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {players.length < 20 && (
                  <button
                    type="button"
                    onClick={handleAddPlayer}
                    className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                  >
                    <Plus className="h-4 w-4" />
                    Add another player
                  </button>
                )}

                <p className="text-xs text-on-surface-variant pt-1">
                  {players.filter((p) => p.trim().length > 0).length} player{players.filter((p) => p.trim().length > 0).length !== 1 ? "s" : ""} added
                  {" · "}Minimum 2 to start
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 rounded-lg border border-error/20 bg-error-container/10 px-4 py-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed bottom nav */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 backdrop-blur-md px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="cursor-pointer flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep !== "players" ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance()}
              className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-on-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAdvance() || isPending}
              className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-on-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Group
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
