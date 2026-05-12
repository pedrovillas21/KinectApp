# Graph Report - .  (2026-05-12)

## Corpus Check
- Corpus is ~27,693 words - fits in a single context window. You may not need a graph.

## Summary
- 338 nodes · 510 edges · 45 communities (29 shown, 16 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]

## God Nodes (most connected - your core abstractions)
1. `COLORS` - 22 edges
2. `ThemeContext` - 19 edges
3. `JwtUtil` - 10 edges
4. `AuthContext` - 9 edges
5. `StatsService` - 8 edges
6. `formatNumberPtBR()` - 7 edges
7. `SecurityConfig` - 6 edges
8. `WorkoutService` - 6 edges
9. `AuthController` - 5 edges
10. `WeightHistoryRepository` - 5 edges

## Surprising Connections (you probably didn't know these)
- `DeltaChip()` --calls--> `formatNumberPtBR()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `WeightCard()` --calls--> `periodDescription()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `WeightCard()` --calls--> `formatNumberPtBR()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `VolumeCard()` --calls--> `formatTotalVolume()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts
- `VolumeCard()` --calls--> `formatVolumeKg()`  [EXTRACTED]
  KineticApp/src/screens/StatsScreen.tsx → KineticApp/src/utils/statsUtils.ts

## Communities (45 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (24): styles, styles, styles, styles, styles, styles, styles, styles (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (39): CardHeaderProps, chipStyles, ConsistencyCardProps, consistencyStyles, DeltaChip(), DeltaChipProps, InsightBlockProps, insightStyles (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (8): AuthController, UserController, UserRepository, WeightHistoryRepository, CustomUserDetailsService, AuthService, UserService, UserDetailsService

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (12): endDate(), fromString(), id(), insightTag(), previousEndDate(), previousStartDate(), startDate(), targetSessions() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (3): WorkoutSessionRepository, CommunityStatsService, WorkoutSessionService

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (11): EvolutionModalProps, styles, EMPTY_DASHBOARD, HomeScreenProps, LeaderboardEntry, LEADERS, styles, WEEK_DAYS (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (3): WorkoutController, WorkoutPlanRepository, WorkoutService

### Community 7 - "Community 7"
Cohesion: 0.24
Nodes (3): OncePerRequestFilter, JwtAuthenticationFilter, JwtUtil

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (6): json(), of(), getText(), RuntimeException, GeminiService, InvalidGeminiResponseException

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (8): styles, styles, DAY_A, DAY_B, DAY_C, mockFeed, mockSquad, WORKOUT_MAP

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (5): styles, SetData, styles, LogSessionRequestDTO, SetLogDto

## Knowledge Gaps
- **69 isolated node(s):** `LoginDTO`, `RegisterDTO`, `ResetPasswordDTO`, `VerifyEmailDTO`, `Exercise` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `LoginDTO`, `RegisterDTO`, `ResetPasswordDTO` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._