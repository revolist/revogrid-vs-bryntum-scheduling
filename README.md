# RevoGrid scheduling surfaces

Bryntum’s July 2026 comparison mounted RevoGrid’s Gantt plugin and resource-planning mode. RevoGrid also provides a separate Event Scheduler plugin designed for event, booking, shift, and resource-timeline workflows. This repository makes the distinction reproducible.

The source comparison is Bryntum’s [July 2026 article](https://bryntum.com/blog/revogrid-vs-bryntum-javascript-scheduler-comparison-2026/) and its [public reproduction repository](https://github.com/bryntum/bryntum-vs-revogrid-scheduling).

![RevoGrid Gantt and Event Scheduler shown with the same resources and events](assets/revogrid-scheduling-surfaces.gif)

## What this repository mounts

| Panel | Imported component | Configuration |
| --- | --- | --- |
| RevoGrid Gantt — resource-planning view | `GanttPlugin` from `@revolist/revogrid-enterprise` | `resourcePlanning.enabled: true`, daily load, capacity line, and over-allocation highlighting |
| RevoGrid Event Scheduler — resource timeline | `EventSchedulerPlugin` from `@revolist/revogrid-enterprise` | `view: 'resourceTimeline'`, movable events, overlap marking, and blocked-time prevention |

Both panels adapt the same neutral source data: five resources, six dated events,
the Aug 3–9, 2026 date range, an intentional Alex Morgan overlap, and Nina
Patel’s blocked Aug 7 range. The Gantt adapter produces tasks, resources, and
assignments. The Event Scheduler adapter produces resource rows, events, and
availability.

In the second panel, drag **Hotfix deploy** from **Alex Morgan** to **Nina
Patel** on Aug 5. The event is reassigned by the `EventSchedulerPlugin`
projection. A drop onto Nina’s hatched Aug 7 cell is rejected because
`blocked-time` is configured as an error.

## Pinned versions

Every dependency is exact, and `pnpm-lock.yaml` is committed.

| Package or tool | Version |
| --- | --- |
| `@revolist/revogrid` | `4.23.21` |
| `@revolist/revogrid-pro` | `2.2.13` |
| `@revolist/revogrid-enterprise` | `2.2.13` |
| Vite | `7.3.5` |
| TypeScript | `5.9.3` |
| Playwright | `1.59.1` |
| Node.js | `24.13.0` |
| pnpm | `10.5.2` |

These are comparison-era RevoGrid versions. The repository is intended to show
that the dedicated Event Scheduler existed alongside the Gantt
resource-planning surface during the comparison window.

## Registry authentication

RevoGrid Pro and Enterprise are commercial packages published to the private
GitHub Packages registry. Your account needs a package entitlement and a token
with `read:packages`.

```sh
export NODE_AUTH_TOKEN=YOUR_GITHUB_PACKAGES_TOKEN
pnpm install --frozen-lockfile
```

The Pages workflow runs only on trusted pushes to `main`. It uses the repository
`GITHUB_TOKEN` with `packages: read`; the repository must be granted read access
to the RevoGrid Pro and Enterprise packages.

## Run and verify

```sh
pnpm dev
pnpm typecheck
pnpm build
pnpm test:e2e
```

The test suite contains exactly three Chromium tests:

1. Both plugin identities, Gantt resource-planning configuration, and Scheduler
   resource rows.
2. Cross-resource movement of **Hotfix deploy**, including the
   `EventSchedulerPlugin` projection.
3. Overlap and unavailable-time markers, plus rejection of a blocked-time drop.

## Reproduce the GIF

The recording script launches Vite, records the page with Playwright, performs
the valid cross-resource drag, and converts the resulting WebM with `ffmpeg`.

```sh
pnpm exec playwright install chromium
FFMPEG_PATH=/opt/homebrew/bin/ffmpeg pnpm record
```

The optimized output is
`assets/revogrid-scheduling-surfaces.gif`. The intermediate WebM is ignored.

## Scope and licensing

This is not a performance benchmark. It makes no throughput, latency, feature
parity, or product-ranking claim. It demonstrates one factual distinction:
Bryntum mounted RevoGrid’s Gantt resource-planning view, while RevoGrid also
ships a dedicated Event Scheduler resource-timeline plugin.

The benchmark wrapper is MIT licensed. RevoGrid Pro and Enterprise remain
commercial dependencies governed by their own license terms.
