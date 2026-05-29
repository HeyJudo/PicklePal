# PicklePal V1 Design

Date: 2026-05-29

## Product Summary

PicklePal is a mobile/tablet-first pickleball web app for a friend group that wants fast live scoring, fair rotations, persistent rankings, and shareable post-session highlights.

Working identity:

```text
PicklePal
The scoreboard for your pickleball crew.
```

The product should feel friendly and social at its foundation, with competitive energy layered in through rankings, winner/loser labels, MVP, hottest duo, and recap cards. During live scoring, the app should be calm, accurate, and easy to operate courtside. After games and sessions, it can feel more celebratory.

V1 is built for one friend group first, but the data model should include a `Group` boundary so it can later support more groups without a rewrite.

## V1 Scope

### Included

- Public homepage/dashboard.
- Public persistent leaderboard.
- Player roster without individual player accounts.
- Host/admin PIN for write actions.
- Game Day/session creation.
- Present-player selection.
- Singles and doubles support, with doubles as the default.
- Fair random matchup generation.
- Automatic sit-out and bench rotation.
- Position confirmation before each match.
- Official traditional pickleball side-out scoring.
- Rally-winner scoring buttons.
- Undo rally.
- Winner/Loser post-game result screen.
- Match history.
- MVP of the Day.
- Hottest Duo.
- Best Match.
- Instagram-style Game Day recap card.
- Offline-resilient active scoring.
- Responsive mobile, tablet, and desktop layout.

### Excluded From V1

- Individual user accounts.
- Full login wall.
- Elo, DUPR, or skill ratings.
- Tournament brackets.
- Full offline-first app launch and browsing.
- Direct Instagram API posting.
- Multi-device scoring for the same active game.
- Advanced charts and social feeds.

## Access Model

Viewing should be frictionless.

Public pages:

- Home.
- Leaderboard.
- History.
- Players.
- Completed session recap.

PIN-protected actions:

- Start/end session.
- Add/edit players.
- Score a match.
- Correct/delete matches.
- Change game settings.

The host PIN should be requested only when a user attempts a write action. Once entered successfully, host permission can be remembered in that browser for a reasonable period.

## Core Game Day Flow

```text
Open PicklePal
-> View active Game Day or dashboard
-> Host enters PIN only when editing/scoring
-> Start Game Day
-> Select present players
-> Choose singles or doubles
-> Generate fair matchups
-> Confirm court positions and starting server
-> Score live rally-by-rally
-> Finish match
-> Show Winner/Loser result
-> Save match
-> Advance to next match
-> End session manually
-> Generate MVP, Hottest Duo, Best Match, and recap card
```

Sessions are manually ended by the host. Ending a session finalizes the MVP, Hottest Duo snapshot, Best Match, session summary, and share card.

## Navigation And Screens

Mobile bottom navigation:

```text
Home | Live | Board | History | Players
```

Host settings can live behind a small icon or menu.

### Home

If an active session exists, Home should prioritize the current Game Day. If no active session exists, Home should become the group dashboard.

Home modules:

- Current number-one player.
- Hottest Duo.
- Latest MVP of the Day.
- Current or next match.
- Leaderboard preview.
- Recent match results.

### Live

The Live area owns the Game Day loop:

- Start session.
- Select present players.
- Choose match type.
- Generate matchup queue.
- Show visible bench queue.
- Confirm player positions.
- Confirm or change starting server.
- Score live on a court-style screen.
- Show sync status.
- Show post-game Winner/Loser result.
- Advance to next match.

### Leaderboard

Leaderboard is persistent across sessions and ranked by win rate. It should show:

- Rank.
- Player.
- Wins.
- Losses.
- Games played.
- Win rate.
- Point differential.

Players below the minimum-games threshold can appear as unqualified until they have enough games.

### History

History shows simple readable results by default:

```text
May 29, 2026
Jude + Andre beat Mark + Gio
11-7
Doubles
```

The app should preserve rally-by-rally events internally for audit, undo/replay possibilities, and future analytics.

### Players

Players are roster entries, not user accounts.

Player fields:

- Display name or nickname.
- Optional avatar or color.
- Active/inactive status.
- Derived stats.

### Share Card

The share card is a vertical Instagram-story-style Game Day recap generated when the host ends a session.

It should include:

- PicklePal branding.
- Session title/date.
- MVP of the Day.
- Hottest Duo.
- Top Player.
- Best Match.

V1 should support downloading or sharing the generated image from the browser. Direct posting to Instagram is not part of V1.

## Data Model

Saved matches are the source of truth. Leaderboards and awards should be derived from completed matches, not stored as permanent truth.

Recommended entities:

```text
Group
- id
- name
- publicSlug
- hostPinHash
- createdAt

Player
- id
- groupId
- displayName
- avatarUrl
- color
- isActive
- createdAt

Session
- id
- groupId
- title
- status: active | completed | cancelled
- startedAt
- endedAt
- defaultMatchType
- targetScore
- winBy

Match
- id
- sessionId
- matchType: singles | doubles
- status: queued | active | completed | cancelled
- teamAPlayerIds
- teamBPlayerIds
- teamAScore
- teamBScore
- winningTeam
- losingTeam
- startingServerPlayerId
- finalServerState
- startedAt
- completedAt
- updatedAt

RallyEvent
- id
- matchId
- sequenceNumber
- rallyWinnerTeam
- resultingTeamAScore
- resultingTeamBScore
- serverPlayerId
- serverNumber
- sideOutOccurred
- createdAt

MatchQueueItem
- id
- sessionId
- matchId
- queueOrder
- status

RecapCard
- id
- sessionId
- imageUrl or generatedConfig
- createdAt
```

Derived values:

- Leaderboard rows.
- Player stats.
- Duo stats.
- MVP result.
- Best Match.
- Player session stats.

If performance later requires caching, cached stats must be rebuildable from completed matches.

## Matchmaking And Rotation

V1 supports singles and doubles, with doubles as the default.

Rotation style: fair random.

For doubles, the generator should:

- Select four players.
- Balance games played during the session.
- Minimize repeated teammates.
- Minimize repeated opponent pairings.
- Rotate sit-outs fairly.
- Avoid benching the same player twice before others have sat once when possible.

For singles, the generator should:

- Select two players.
- Avoid immediate rematches when possible.
- Balance games played.
- Rotate sit-outs fairly.

Late arrivals and early leavers affect only future matchups. Completed matches remain unchanged unless the host explicitly corrects them. Current live matches continue unless cancelled.

## Scoring Rules

Default scoring mode: traditional pickleball side-out scoring.

Default game settings:

```text
Match type: doubles
Target score: 11
Win by: 2
Scoring: traditional side-out
```

The host can edit:

- Singles/doubles.
- Target score.
- Win-by amount.
- Starting server.
- Initial player positions.

The live scoring interface should use rally-winner buttons:

- Team A won rally.
- Team B won rally.

The app, not the scorer, decides whether that rally causes a point, server switch, side-out, position update, or game end.

The rules engine should be a pure TypeScript module. Every rally should produce a new match state. Rally events should be append-only. Undo should revert to the previous state.

### Doubles State

The doubles engine must track:

```text
teamAScore
teamBScore
servingTeam
currentServerPlayerId
serverNumber: 1 | 2
firstServiceSequence: true | false
player court positions
```

It must handle the first-service-sequence exception and standard doubles server sequence.

### Singles State

The singles engine must track:

```text
teamAScore
teamBScore
servingPlayerId
receiverPlayerId
court side based on server score parity
```

### Accuracy Requirement

Scoring correctness is a foundation requirement. Unit tests must cover official scoring cases before visual polish is treated as complete.

## Stats And Awards

### Leaderboard

Primary ranking:

```text
Qualified players ranked by win rate
Tiebreaker 1: more games played
Tiebreaker 2: point differential
```

Recommended V1 minimum qualification: enough games to avoid a one-game player becoming the top-ranked player. A starting threshold of three games is reasonable and can be configurable later.

### Hottest Duo

Hottest Duo is the doubles pair with the best win rate together.

Recommended formula:

```text
Minimum games together: 3
Primary: duo win rate
Tiebreaker 1: more wins together
Tiebreaker 2: duo point differential
```

### MVP Of The Day

MVP is automatically calculated for each session.

Recommended formula:

```text
MVP score =
session wins * 3
+ session point differential
+ session games played
```

Eligibility:

```text
Minimum 2 games played in the session
```

The formula rewards winning first, then point differential, then participation.

### Best Match

Best Match is the closest completed match in a session.

Formula:

```text
Primary: lowest absolute score difference
Tiebreaker: highest combined score
```

Singles and doubles are both eligible.

## Offline-Resilient Scoring

V1 should support offline-resilient active scoring, not full offline-first behavior.

Included:

- If the live game screen is already open, scoring continues when internet drops.
- Rally events are saved locally first.
- Match can be finished locally.
- UI shows offline/local-save/sync status.
- When internet returns, pending events sync.
- If sync fails, host can retry.
- One scorer device is the source of truth for an active match.

Excluded:

- Opening the entire app from scratch without internet.
- Full offline leaderboard/history browsing.
- Multiple scorer devices resolving offline conflicts.

## Responsive Visual Direction

The app should prioritize phones and tablets, while still being responsive on desktop.

Design direction:

- Sporty, clean, social, and mobile-first.
- Court visualization for live scoring.
- Players visibly placed on the court.
- Big readable score.
- High-contrast outdoor-friendly UI.
- Green/blue sport palette without making the whole app one-color.
- White/light surfaces for daytime readability.
- Hype-oriented post-game and recap screens.

Desktop Live layout can use three columns:

```text
Left: queue and bench
Center: live court scoreboard
Right: leaderboard, MVP race, Hottest Duo
```

## Technical Stack

Recommended stack:

```text
Framework: Next.js + React + TypeScript
Styling: Tailwind CSS
UI components: shadcn-style component patterns
Database: Supabase Postgres
Backend: Next.js server actions or route handlers
Deployment: Vercel
Image/card generation: browser-rendered HTML/canvas export
Auth model: public read, host PIN for writes
Offline support: active-game local event queue + sync retry
```

## Build Milestones

### 1. Project Foundation

- Next.js, TypeScript, and Tailwind setup.
- Basic app shell and navigation.
- Supabase setup.
- Public group route.
- Host PIN write protection.

### 2. Data Model

- Tables for groups, players, sessions, matches, rally events, queue items, and recap cards.
- Seed/demo data.
- Derived stat functions.
- Match correction behavior.

### 3. Scoring Rules Engine

- Pure TypeScript scoring engine.
- Singles and doubles logic.
- Side-out scoring.
- First-service-sequence handling.
- Court/server state tracking.
- Undo support.
- Unit tests for official scoring cases.

### 4. Game Day Loop

- Start session.
- Select present players.
- Choose singles/doubles.
- Generate fair random matchups.
- Show bench queue.
- Confirm positions and starting server.
- Live court scoring screen.
- Winner/Loser result screen.
- Save match.
- Advance to next match.

### 5. Stats And History

- Persistent leaderboard.
- Minimum-games qualifier.
- Player stat pages.
- Match history.
- Session summaries.
- MVP of the Day.
- Hottest Duo.
- Best Match.

### 6. Offline-Resilient Scoring

- Local rally event queue.
- Sync status.
- Retry sync.
- Recovery after reload during an active match if feasible.
- Clear one-scorer-device conflict handling.

### 7. Share Cards

- Game Day recap layout.
- Instagram-story aspect ratio.
- MVP, Hottest Duo, Top Player, and Best Match.
- Download/share image.
- Public recap page.

### 8. Visual Polish And QA

- Mobile/tablet-first court UI.
- Desktop responsive layout.
- Outdoor-readable contrast.
- Loading, empty, and error states.
- Browser testing.
- Rules-engine test coverage.
- End-to-end Game Day test.

## First Implementation Checkpoint

The first checkpoint should be a working local prototype where the host can:

```text
create players
-> start a session
-> generate one match
-> score it live
-> save the result
-> see the leaderboard update
```

This proves the hardest product loop before investing heavily in share cards, advanced dashboards, and visual polish.
