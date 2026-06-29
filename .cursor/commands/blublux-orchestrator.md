# BluBlux Orchestrator

Start or resume the S1–S33 build as the in-context orchestrator (primary driver).

## Instructions

1. Read the **blublux-orchestrator** skill (`.cursor/skills/blublux-orchestrator/SKILL.md`)
2. Read `docs/2026-06-27_blublux-games_progress.md` to find current step
3. If progress is NOT STARTED, seed S1–S33 as pending and begin SETUP → S1
4. Drive worker (`blublux-worker`) → reviewer (`blublux-reviewer`) → fix loop per orchestrator skill
5. STOP at gates S15, S31, S32, S33 until user gives explicit "go"

## Sources

- Steps: `docs/2026-06-27_blublux-games_implementation-steps.md`
- Plan: `docs/2026-06-27_blublux-games_plan.md`
- Progress: `docs/2026-06-27_blublux-games_progress.md`
- Factory: `.cursor/skills/phaser4-game-factory/`

Report one-line status after each step. Keep prose minimal.
