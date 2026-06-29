# BluBlux Games — Reference

## Package map

| Package | Scope | Responsibility |
|---|---|---|
| `@blublux/config` | S1 | eslint/tsconfig/vite presets |
| `@blublux/engine` | S2–S4, S13 | seams (Rng/Clock), ports/fakes, Phaser scaffold, game-shell |
| `@blublux/ads-adapter` | S5 | Ads iface; AdMob+UMP native; web H5/portal |
| `@blublux/engine-sort` | S9–S12 | pure model+gen+solver / Phaser view |
| `@blublux/engine-block` | S20–S22 | pure model+bag / Phaser view |

## Apps

| App | appId | Engine | Mode |
|---|---|---|---|
| sort-collection | com.blublux.sortcollection | engine-sort | 4 themes: Butterfly, iColorcoin, Sand, Nuts&Bolts |
| knotwork | com.blublux.knotwork | engine-block | box9, 9×9 |
| beaver-block | com.blublux.beaverblock | engine-block | lines, 8×8 |

Per-skin appIds (`com.blublux.butterflysort`, etc.) are web/Option-C only — not native listings.

## Model APIs

### engine-sort

```typescript
// SortState { containers, capacity:K, colors:C }
// Move { from, to, count }
legalMoves(s): Move[]
applyMove(s, m): SortState   // immutable
isWon(s): boolean
isStuck(s): boolean
undo(): SortState
solve(s): Move[] | null
hint(s): Move | null
generate(tier, seed): SortState
```

Solvability gate: **≥1,000 seeds/tier @ 100% solvable** (CI enforced).

### engine-block

```typescript
// GridMode = 'box9' | 'lines'
// GridState { cells, size, mode }
place(s, piece, cell): GridState
clear(s): { state, cleared: { rows, cols, boxes } }
scoreFor(placement, cleared, combo): number
isGameOver(s): boolean
nextTrio(state, rng): Piece[3]
```

box9 clears rows + cols + 3×3 boxes. lines clears rows + cols only.

## Injected ports (composition root only)

`Ads`, `IAP`, `Analytics`, `Leaderboard`, `Storage`, `Haptics`, `ConsentManager`, `AudioBus`, `Clock`, `Rng`

Each has a fake in `@blublux/engine` for tests.

## UMP order (invariant)

```
initialize() → requestConsentInfo() → showConsentForm() if required
→ canRequestAds === true → ONLY THEN load/show ads
```

## Monetization defaults (Remote Config)

- Sort: interstitial every 3 cleared levels + on fail/restart
- Block: interstitial on game-over
- Rewarded: opt-in only; grant on verified completion event
- First-session grace: no interstitial before first completion / ~60–90s
- Remove-Ads (IAP): kills interstitials; rewarded stays

## Dependency graph (phases)

```
P1  S1 → {S2,S3,S4} ; S3 → {S5,S6,S7,S8}
P2  S2 → S9 → {S10,S11}
P5  S2 → S20 → S21                    # parallel to P2
P3  → S12,S13 → S14 → S15 ⛔ GATE
P4  S15 → {S16,S17,S18} → S19
P6  S15,S20 → S22 → S23 → S24
P7  S13,S22 → S25 → S26
P8  → {S27,S28,S29} → S30 → S31 → S32 → S33
```

## Template placeholders (S1 swap)

```
@studio/*     → @blublux/*
__GAME_ID__   → sort-collection | knotwork | beaver-block
__APP_ID__    → com.blublux.{sortcollection|knotwork|beaverblock}
__APP_NAME__  → "Sort Puzzle Collection" | "Knotwork" | "Beaver's Block"
```

Templates: `.cursor/skills/phaser4-game-factory/assets/templates/`

## Review routing

| Area | Steps | Focus |
|---|---|---|
| Security | S5,S6,S7,S14,S23,S25,S30,S31,S33 | UMP, consent, SDK boundaries, secrets |
| Model purity | S2,S9,S10,S11,S20,S21 | TDD, determinism, no Phaser in model |
| General | all others | correctness, DRY, Verify genuinely passed |

## Linked skill paths (symlinks)

- Factory: `.cursor/skills/phaser4-game-factory/`
- Orchestration: `.cursor/skills/migration-orchestration/`
