"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Link2,
  Check,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { checkSlugAvailability, createGroup } from "./actions";

type Step = "name" | "slug" | "players";

const STEPS: Step[] = ["name", "slug", "players"];

export default function OnboardingFlow() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentStep, setCurrentStep] = useState<Step>("name");
  const [direction, setDirection] = useState<1 | -1>(1);
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
      setDirection(1);
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    setError(null);
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setDirection(-1);
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

  const filledPlayers = players.filter((p) => p.trim().length > 0).length;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      filter: "blur(4px)",
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[80px] translate-y-1/2 -translate-x-1/3" />
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-full h-1 bg-surface-container-high/50">
        <motion.div
          className="h-full bg-primary rounded-r-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-5">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <span className="font-headline text-base font-bold text-on-background tracking-tight">
            DinkDay
          </span>
          <div className="flex items-center gap-1.5">
            {STEPS.map((step, i) => (
              <motion.div
                key={step}
                className="h-1.5 rounded-full"
                animate={{
                  width: i === stepIndex ? 24 : 8,
                  backgroundColor: i <= stepIndex ? "var(--color-primary)" : "var(--color-outline-variant)",
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-28">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step: Name */}
            {currentStep === "name" && (
              <motion.div
                key="name"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              >
                <div className="mb-10">
                  <motion.h1
                    className="font-headline text-3xl font-bold text-on-background leading-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    What do you <span className="text-primary">call</span> your crew?
                  </motion.h1>
                  <motion.p
                    className="mt-3 text-on-surface-variant text-[15px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    This is what everyone in your group will see.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canAdvance() && handleNext()}
                    placeholder="Sunday Court Crew"
                    maxLength={50}
                    autoFocus
                    className="w-full rounded-xl border-2 border-border bg-surface px-5 py-4 text-lg text-on-background font-medium placeholder:text-text-muted/50 placeholder:font-normal outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,122,69,0.08)]"
                  />
                  {groupName.trim().length > 0 && (
                    <motion.p
                      className="mt-3 text-xs text-on-surface-variant"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                    >
                      Your URL will be: <span className="font-mono text-primary">dinkday.app/g/{generateSlug(groupName) || "..."}</span>
                    </motion.p>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Step: Slug */}
            {currentStep === "slug" && (
              <motion.div
                key="slug"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              >
                <div className="mb-10">
                  <motion.h1
                    className="font-headline text-3xl font-bold text-on-background leading-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    Pick your <span className="text-primary">link</span>
                  </motion.h1>
                  <motion.p
                    className="mt-3 text-on-surface-variant text-[15px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    Share this URL with your crew so they can check scores and leaderboards.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="space-y-3"
                >
                  <div className="flex items-stretch rounded-xl border-2 border-border bg-surface overflow-hidden transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(8,122,69,0.08)]">
                    <div className="flex items-center bg-surface-container-high/60 px-4 border-r border-border">
                      <span className="text-sm text-on-surface-variant whitespace-nowrap">
                        <Link2 className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                        /g/
                      </span>
                    </div>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      onBlur={handleCheckSlug}
                      onKeyDown={(e) => e.key === "Enter" && handleCheckSlug()}
                      placeholder="your-crew"
                      maxLength={40}
                      autoFocus
                      className="flex-1 bg-transparent px-4 py-4 text-lg text-on-background font-medium placeholder:text-text-muted/50 placeholder:font-normal outline-none"
                    />
                    <div className="flex items-center pr-4">
                      <AnimatePresence mode="wait">
                        {slugStatus === "checking" && (
                          <motion.div
                            key="checking"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Loader2 className="h-5 w-5 text-on-surface-variant animate-spin" />
                          </motion.div>
                        )}
                        {slugStatus === "available" && (
                          <motion.div
                            key="available"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary"
                          >
                            <Check className="h-3.5 w-3.5 text-white" />
                          </motion.div>
                        )}
                        {slugStatus === "taken" && (
                          <motion.div
                            key="taken"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-error"
                          >
                            <X className="h-3.5 w-3.5 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <AnimatePresence>
                    {slugStatus === "available" && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-primary font-medium"
                      >
                        You&apos;re good to go
                      </motion.p>
                    )}
                    {slugError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-error"
                      >
                        {slugError}
                      </motion.p>
                    )}
                    {slugStatus === "idle" && slug.length >= 3 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-on-surface-variant"
                      >
                        Tap away or press Enter to check
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}

            {/* Step: Players */}
            {currentStep === "players" && (
              <motion.div
                key="players"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              >
                <div className="mb-8">
                  <motion.h1
                    className="font-headline text-3xl font-bold text-on-background leading-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    Who&apos;s <span className="text-primary">playing</span>?
                  </motion.h1>
                  <motion.p
                    className="mt-3 text-on-surface-variant text-[15px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    Add your regulars. Just first names work — you can always add more later.
                  </motion.p>
                </div>

                <motion.div
                  className="space-y-2.5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  {players.map((player, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <motion.div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                        style={{
                          backgroundColor: [
                            "#2D8B4E", "#2196F3", "#F5C518", "#FF6B35",
                            "#9C27B0", "#E53935", "#00BCD4", "#4CAF50",
                            "#FF9800", "#3F51B5", "#795548", "#607D8B",
                            "#8BC34A", "#CDDC39", "#009688", "#673AB7",
                            "#FFC107", "#03A9F4", "#FF5722", "#9E9E9E",
                          ][index % 20],
                        }}
                        animate={{
                          scale: player.trim() ? 1 : 0.9,
                          opacity: player.trim() ? 1 : 0.6,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {player.trim() ? player.trim()[0].toUpperCase() : "?"}
                      </motion.div>
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
                        className="flex-1 rounded-xl border-2 border-border bg-surface px-4 py-3 text-sm text-on-background font-medium placeholder:text-text-muted/50 placeholder:font-normal outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,122,69,0.08)]"
                      />
                      {players.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(index)}
                          className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant/40 transition-all hover:bg-error/10 hover:text-error"
                          aria-label={`Remove player ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}

                  {players.length < 20 && (
                    <motion.button
                      type="button"
                      onClick={handleAddPlayer}
                      className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 px-4 py-3 text-sm text-on-surface-variant transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="h-4 w-4" />
                      Add player
                    </motion.button>
                  )}

                  <p className="text-xs text-on-surface-variant pt-2">
                    <span className="font-medium text-on-background">{filledPlayers}</span> player{filledPlayers !== 1 ? "s" : ""} added · min 2
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 rounded-xl border border-error/20 bg-error/5 px-4 py-3"
              >
                <p className="text-sm text-error">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="bg-gradient-to-t from-background via-background/95 to-transparent h-8 pointer-events-none" />
        <div className="bg-background border-t border-border/50 px-4 py-4">
          <div className="mx-auto max-w-md flex items-center justify-between">
            {stepIndex > 0 ? (
              <motion.button
                type="button"
                onClick={handleBack}
                className="cursor-pointer flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                whileTap={{ scale: 0.96 }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </motion.button>
            ) : (
              <div />
            )}

            {currentStep !== "players" ? (
              <motion.button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance()}
                className="cursor-pointer flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
                whileTap={{ scale: 0.96 }}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!canAdvance() || isPending}
                className="cursor-pointer flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
                whileTap={{ scale: 0.96 }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Let&apos;s go
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
