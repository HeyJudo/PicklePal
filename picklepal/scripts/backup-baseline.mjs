import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const envPath = path.join(appRoot, ".env.local");
const backupRoot = path.join(appRoot, "backups");

const tableNames = [
  "groups",
  "players",
  "sessions",
  "matches",
  "rally_events",
  "match_queue_items",
  "recap_cards",
  "session_players",
];

function parseEnv(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .reduce((acc, line) => {
      const index = line.indexOf("=");
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

async function loadEnv() {
  const fileEnv = existsSync(envPath) ? parseEnv(await readFile(envPath, "utf8")) : {};
  return {
    ...fileEnv,
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function requiredEnv(env, key) {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing ${key}. Add it to .env.local or the process environment.`);
  }
  return value;
}

async function fetchAllRows(supabase, tableName) {
  const pageSize = 1000;
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .range(from, to);

    if (error) {
      throw new Error(`Failed to export ${tableName}: ${error.message}`);
    }

    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

function groupById(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

function matchesForGroup(groupId, sessions, matches) {
  const sessionIds = new Set(
    sessions.filter((session) => session.group_id === groupId).map((session) => session.id),
  );
  return matches.filter((match) => sessionIds.has(match.session_id));
}

function countRowsByGroup(groupId, exported) {
  const sessionIds = new Set(
    exported.sessions
      .filter((session) => session.group_id === groupId)
      .map((session) => session.id),
  );
  const matchIds = new Set(
    exported.matches
      .filter((match) => sessionIds.has(match.session_id))
      .map((match) => match.id),
  );

  return {
    groups: 1,
    players: exported.players.filter((player) => player.group_id === groupId).length,
    sessions: sessionIds.size,
    matches: matchIds.size,
    rally_events: exported.rally_events.filter((event) => matchIds.has(event.match_id)).length,
    match_queue_items: exported.match_queue_items.filter((item) =>
      sessionIds.has(item.session_id),
    ).length,
    recap_cards: exported.recap_cards.filter((card) => sessionIds.has(card.session_id)).length,
    session_players: exported.session_players.filter((entry) =>
      sessionIds.has(entry.session_id),
    ).length,
  };
}

function computeLeaderboard(players, matches) {
  const completedMatches = matches.filter((match) => match.status === "completed");
  const statsMap = new Map(
    players.map((player) => [
      player.id,
      { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
    ]),
  );

  for (const match of completedMatches) {
    const teamAWon = match.winning_team === "A";

    for (const playerId of match.team_a_player_ids ?? []) {
      const stats = statsMap.get(playerId);
      if (!stats) continue;
      if (teamAWon) stats.wins += 1;
      else stats.losses += 1;
      stats.pointsFor += match.team_a_score;
      stats.pointsAgainst += match.team_b_score;
    }

    for (const playerId of match.team_b_player_ids ?? []) {
      const stats = statsMap.get(playerId);
      if (!stats) continue;
      if (!teamAWon) stats.wins += 1;
      else stats.losses += 1;
      stats.pointsFor += match.team_b_score;
      stats.pointsAgainst += match.team_a_score;
    }
  }

  let rank = 1;
  return players
    .map((player) => {
      const stats = statsMap.get(player.id);
      const gamesPlayed = stats.wins + stats.losses;
      const winRate = gamesPlayed > 0 ? stats.wins / gamesPlayed : 0;
      const pointDifferential = stats.pointsFor - stats.pointsAgainst;
      return {
        playerId: player.id,
        displayName: player.display_name,
        wins: stats.wins,
        losses: stats.losses,
        gamesPlayed,
        winRate,
        pointDifferential,
        isQualified: gamesPlayed >= 3,
        rank: null,
      };
    })
    .sort((a, b) => {
      if (a.isQualified && !b.isQualified) return -1;
      if (!a.isQualified && b.isQualified) return 1;
      if (a.winRate !== b.winRate) return b.winRate - a.winRate;
      if (a.gamesPlayed !== b.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      return b.pointDifferential - a.pointDifferential;
    })
    .map((entry) => ({ ...entry, rank: entry.isQualified ? rank++ : null }));
}

function computePlayerStats(player, matches) {
  const playerMatches = matches
    .filter((match) => match.status === "completed")
    .filter(
      (match) =>
        match.team_a_player_ids?.includes(player.id) ||
        match.team_b_player_ids?.includes(player.id),
    );

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const match of playerMatches) {
    const isTeamA = match.team_a_player_ids.includes(player.id);
    const teamAWon = match.winning_team === "A";
    const playerWon = isTeamA ? teamAWon : !teamAWon;
    if (playerWon) wins += 1;
    else losses += 1;
    pointsFor += isTeamA ? match.team_a_score : match.team_b_score;
    pointsAgainst += isTeamA ? match.team_b_score : match.team_a_score;
  }

  const gamesPlayed = wins + losses;
  return {
    playerId: player.id,
    displayName: player.display_name,
    wins,
    losses,
    gamesPlayed,
    winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
    pointDifferential: pointsFor - pointsAgainst,
    recentMatches: playerMatches
      .sort((a, b) =>
        (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at),
      )
      .slice(0, 10)
      .map((match) => ({
        matchId: match.id,
        matchType: match.match_type,
        teamAPlayerIds: match.team_a_player_ids,
        teamBPlayerIds: match.team_b_player_ids,
        teamAScore: match.team_a_score,
        teamBScore: match.team_b_score,
        winningTeam: match.winning_team,
        completedAt: match.completed_at,
      })),
  };
}

function makeDuoKey(idA, idB) {
  return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
}

function computeSessionAwards(players, sessionMatches) {
  const completed = sessionMatches.filter((match) => match.status === "completed");
  const playerMap = groupById(players);
  const mvpStats = new Map();
  const duoMap = new Map();

  for (const match of completed) {
    const teamAWon = match.winning_team === "A";

    for (const [ids, pointsFor, pointsAgainst, won] of [
      [match.team_a_player_ids ?? [], match.team_a_score, match.team_b_score, teamAWon],
      [match.team_b_player_ids ?? [], match.team_b_score, match.team_a_score, !teamAWon],
    ]) {
      for (const id of ids) {
        const stats = mvpStats.get(id) ?? {
          wins: 0,
          gamesPlayed: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        };
        stats.gamesPlayed += 1;
        if (won) stats.wins += 1;
        stats.pointsFor += pointsFor;
        stats.pointsAgainst += pointsAgainst;
        mvpStats.set(id, stats);
      }

      if (match.match_type === "doubles" && ids.length === 2) {
        const key = makeDuoKey(ids[0], ids[1]);
        const duo = duoMap.get(key) ?? { wins: 0, losses: 0 };
        if (won) duo.wins += 1;
        else duo.losses += 1;
        duoMap.set(key, duo);
      }
    }
  }

  let mvp = null;
  for (const [playerId, stats] of mvpStats) {
    if (stats.gamesPlayed < 2) continue;
    const pointDifferential = stats.pointsFor - stats.pointsAgainst;
    const score = stats.wins * 3 + pointDifferential + stats.gamesPlayed;
    const player = playerMap.get(playerId);
    const candidate = {
      playerId,
      displayName: player?.display_name ?? "Unknown",
      score,
      wins: stats.wins,
      gamesPlayed: stats.gamesPlayed,
      pointDifferential,
    };
    if (!mvp || candidate.score > mvp.score) mvp = candidate;
  }

  let hottestDuo = null;
  for (const [key, stats] of duoMap) {
    const gamesPlayed = stats.wins + stats.losses;
    if (gamesPlayed < 2) continue;
    const [playerAId, playerBId] = key.split("|");
    const candidate = {
      playerAId,
      playerBId,
      playerAName: playerMap.get(playerAId)?.display_name ?? "Unknown",
      playerBName: playerMap.get(playerBId)?.display_name ?? "Unknown",
      wins: stats.wins,
      losses: stats.losses,
      gamesPlayed,
      winRate: stats.wins / gamesPlayed,
    };
    if (!hottestDuo) hottestDuo = candidate;
    else if (candidate.winRate > hottestDuo.winRate) hottestDuo = candidate;
    else if (candidate.winRate === hottestDuo.winRate && candidate.wins > hottestDuo.wins) {
      hottestDuo = candidate;
    }
  }

  let bestMatch = null;
  for (const match of completed) {
    const scoreDifference = Math.abs(match.team_a_score - match.team_b_score);
    const combinedScore = match.team_a_score + match.team_b_score;
    const candidate = {
      matchId: match.id,
      teamAPlayerIds: match.team_a_player_ids,
      teamBPlayerIds: match.team_b_player_ids,
      teamAScore: match.team_a_score,
      teamBScore: match.team_b_score,
      scoreDifference,
      combinedScore,
    };
    if (!bestMatch) bestMatch = candidate;
    else if (candidate.scoreDifference < bestMatch.scoreDifference) bestMatch = candidate;
    else if (
      candidate.scoreDifference === bestMatch.scoreDifference &&
      candidate.combinedScore > bestMatch.combinedScore
    ) {
      bestMatch = candidate;
    }
  }

  return { mvp, hottestDuo, bestMatch };
}

function buildSummary(exported) {
  const sessionsById = groupById(exported.sessions);
  const playersById = groupById(exported.players);

  const totals = Object.fromEntries(
    Object.entries(exported).map(([tableName, rows]) => [tableName, rows.length]),
  );

  const groups = exported.groups.map((group) => {
    const players = exported.players.filter((player) => player.group_id === group.id);
    const sessions = exported.sessions.filter((session) => session.group_id === group.id);
    const matches = matchesForGroup(group.id, exported.sessions, exported.matches);
    const recentHistory = matches
      .filter((match) => match.status === "completed")
      .sort((a, b) =>
        (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at),
      )
      .slice(0, 20)
      .map((match) => ({
        matchId: match.id,
        sessionId: match.session_id,
        sessionTitle: sessionsById.get(match.session_id)?.title ?? null,
        completedAt: match.completed_at,
        source: match.source ?? "live",
        matchType: match.match_type,
        teamA: (match.team_a_player_ids ?? []).map(
          (id) => playersById.get(id)?.display_name ?? id,
        ),
        teamB: (match.team_b_player_ids ?? []).map(
          (id) => playersById.get(id)?.display_name ?? id,
        ),
        teamAScore: match.team_a_score,
        teamBScore: match.team_b_score,
        winningTeam: match.winning_team,
      }));

    return {
      id: group.id,
      slug: group.slug,
      name: group.name,
      counts: countRowsByGroup(group.id, exported),
      leaderboard: computeLeaderboard(players, matches),
      playerStats: players.map((player) => computePlayerStats(player, matches)),
      sessions: sessions
        .sort((a, b) => b.started_at.localeCompare(a.started_at))
        .slice(0, 10)
        .map((session) => {
          const sessionMatches = matches.filter((match) => match.session_id === session.id);
          const completed = sessionMatches.filter((match) => match.status === "completed");
          const playerIds = new Set(
            completed.flatMap((match) => [
              ...(match.team_a_player_ids ?? []),
              ...(match.team_b_player_ids ?? []),
            ]),
          );

          return {
            sessionId: session.id,
            title: session.title,
            status: session.status,
            startedAt: session.started_at,
            endedAt: session.ended_at,
            gamesPlayed: completed.length,
            playerCount: playerIds.size,
            awards: computeSessionAwards(players, sessionMatches),
          };
        }),
      recentHistory,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: "v1-pre-auth",
    tables: tableNames,
    totals,
    groups,
  };
}

async function main() {
  const env = await loadEnv();
  const supabaseUrl = requiredEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.join(backupRoot, `phase-0b-${timestamp}`);
  const dataDir = path.join(outputDir, "data");
  await mkdir(dataDir, { recursive: true });

  const exported = {};
  for (const tableName of tableNames) {
    exported[tableName] = await fetchAllRows(supabase, tableName);
    await writeFile(
      path.join(dataDir, `${tableName}.json`),
      JSON.stringify(exported[tableName], null, 2),
    );
  }

  const summary = buildSummary(exported);
  await writeFile(
    path.join(outputDir, "baseline-summary.json"),
    JSON.stringify(summary, null, 2),
  );

  await writeFile(
    path.join(outputDir, "ROLLBACK.md"),
    [
      "# Phase 0b Rollback Notes",
      "",
      `Generated at: ${summary.generatedAt}`,
      "",
      "This directory contains JSON snapshots for the V1 tables before V2 auth and migration work.",
      "",
      "Rollback approach:",
      "",
      "1. Stop any running V2 migration or deployment.",
      "2. Restore the Supabase project from the provider backup closest to this timestamp when available.",
      "3. If provider restore is unavailable, use the JSON files in `data/` as the source for a manual table restore.",
      "4. Restore parent tables before child tables: groups, players, sessions, matches, rally_events, match_queue_items, recap_cards, session_players.",
      "5. Re-run `pnpm backup:baseline` and compare `baseline-summary.json` against this backup before continuing.",
      "",
      "The exported JSON includes production app data and must not be committed.",
    ].join("\n"),
  );

  console.log(`Phase 0b backup written to ${outputDir}`);
  console.log(JSON.stringify(summary.totals, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
