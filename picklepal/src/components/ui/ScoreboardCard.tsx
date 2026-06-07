import { type HTMLAttributes } from "react";

interface ScoreTeam {
  readonly name: string;
  readonly score: number;
  readonly playerNames?: string[];
  readonly color?: string | null;
}

type ScoreboardVariant = "dark" | "light" | "compact";

interface ScoreboardCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly teamA: ScoreTeam;
  readonly teamB: ScoreTeam;
  readonly winner?: "a" | "b" | null;
  readonly matchType?: string;
  readonly timeLabel?: string;
  readonly variant?: ScoreboardVariant;
}

function TeamScore({
  team,
  isWinner,
  side,
  variant,
}: {
  team: ScoreTeam;
  isWinner: boolean;
  side: "left" | "right";
  variant: ScoreboardVariant;
}) {
  const isDark = variant === "dark";
  const isCompact = variant === "compact";

  return (
    <div
      className={[
        "flex-1 flex flex-col min-w-0",
        side === "left"
          ? "items-start pl-4 border-l-4"
          : "items-end pr-4 border-r-4",
        isWinner
          ? "border-ball-yellow"
          : isDark
          ? "border-white/10"
          : "border-border-muted",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Players */}
      <div
        className={[
          "font-medium leading-tight truncate w-full",
          side === "right" ? "text-right" : "text-left",
          isCompact ? "text-xs" : "text-sm",
          isDark
            ? isWinner
              ? "text-white"
              : "text-white/60"
            : isWinner
            ? "text-text-primary"
            : "text-text-muted",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {team.playerNames?.join(" & ") ?? team.name}
      </div>

      {/* Score */}
      <div
        className={[
          "font-score font-bold tabular-nums leading-none",
          isCompact ? "text-3xl" : "text-5xl",
          isDark
            ? isWinner
              ? "text-white"
              : "text-white/40"
            : isWinner
            ? "text-text-primary"
            : "text-text-muted",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={`Score: ${team.score}`}
      >
        {team.score}
      </div>

      {/* Winner tag */}
      {isWinner && !isCompact && (
        <span className="mt-1 text-[10px] font-label font-semibold uppercase tracking-widest text-ball-yellow">
          Win
        </span>
      )}
    </div>
  );
}

export function ScoreboardCard({
  teamA,
  teamB,
  winner = null,
  matchType,
  timeLabel,
  variant = "dark",
  className = "",
  ...props
}: ScoreboardCardProps) {
  const isDark = variant === "dark";
  const isCompact = variant === "compact";

  return (
    <div
      className={[
        "rounded-xl overflow-hidden",
        isDark
          ? "bg-[#0d2118]"
          : "bg-surface border border-border",
        isCompact ? "py-3" : "py-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {/* Top meta row */}
      {(matchType || timeLabel) && (
        <div
          className={[
            "flex items-center justify-between px-4 mb-3",
            isCompact ? "mb-2" : "mb-4",
          ].join(" ")}
        >
          {matchType && (
            <span
              className={[
                "text-[10px] font-label font-semibold uppercase tracking-widest",
                isDark ? "text-white/50" : "text-text-muted",
              ].join(" ")}
            >
              {matchType}
            </span>
          )}
          {timeLabel && (
            <span
              className={[
                "text-[10px] font-label",
                isDark ? "text-white/35" : "text-text-muted",
              ].join(" ")}
            >
              {timeLabel}
            </span>
          )}
        </div>
      )}

      {/* Score row */}
      <div className="flex items-center gap-4 px-0">
        <TeamScore
          team={teamA}
          isWinner={winner === "a"}
          side="left"
          variant={variant}
        />

        {/* VS divider */}
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <span
            className={[
              "font-score font-bold text-sm tabular-nums",
              isDark ? "text-white/30" : "text-border",
            ].join(" ")}
            aria-hidden="true"
          >
            VS
          </span>
        </div>

        <TeamScore
          team={teamB}
          isWinner={winner === "b"}
          side="right"
          variant={variant}
        />
      </div>
    </div>
  );
}
