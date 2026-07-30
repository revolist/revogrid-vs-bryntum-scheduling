import { defineCustomElements } from '@revolist/revogrid/loader';
import { GanttPlugin } from '@revolist/revogrid-enterprise';
import { EventSchedulerPlugin } from '@revolist/revogrid-enterprise';
import {
  createDefaultTaskTableColumn,
  type EventSchedulerConfig,
  type GanttPluginConfig,
} from '@revolist/revogrid-enterprise';
import {
  CALENDAR_ID,
  DATE_RANGE,
  GANTT_ASSIGNMENTS,
  GANTT_CALENDAR,
  GANTT_RESOURCES,
  GANTT_TASKS,
  RESOURCES,
  SCHEDULER_AVAILABILITY,
  SCHEDULER_EVENTS,
  SCHEDULER_RESOURCES,
} from './shared-data';
import '@revolist/revogrid-pro/dist/rv-pro-trial.css';
import '@revolist/revogrid-enterprise/dist/rv-enterprise-trial.css';
import './styles.css';

defineCustomElements();

interface GanttBenchmarkGrid extends HTMLRevoGridElement {
  gantt: GanttPluginConfig;
  ganttCalendars: typeof GANTT_CALENDAR[];
  ganttResources: typeof GANTT_RESOURCES;
  ganttAssignments: typeof GANTT_ASSIGNMENTS;
}

interface SchedulerBenchmarkGrid extends HTMLRevoGridElement {
  eventScheduler: EventSchedulerConfig;
  eventSchedulerResources: typeof SCHEDULER_RESOURCES;
  eventSchedulerEvents: typeof SCHEDULER_EVENTS;
  eventSchedulerAvailability: typeof SCHEDULER_AVAILABILITY;
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing application root');

app.innerHTML = `
  <main class="benchmark">
    <header class="hero">
      <p class="eyebrow">A reproducible component distinction</p>
      <h1>Two RevoGrid scheduling surfaces</h1>
      <p class="lede">
        The same five people, events, and week are adapted to both components.
        This is a visual benchmark, not a performance benchmark.
      </p>
      <div class="shared-data" aria-label="Shared benchmark data">
        <span>5 resources</span>
        <span>6 events</span>
        <span>Aug 3–9, 2026</span>
      </div>
    </header>

    <section
      class="surface"
      id="gantt-surface"
      data-surface="gantt-resource-planning"
      data-plugin="GanttPlugin"
    >
      <div class="surface__header">
        <div>
          <p class="surface__number">01 · What Bryntum tested</p>
          <h2>RevoGrid Gantt — resource-planning view</h2>
          <code>import { GanttPlugin } from '@revolist/revogrid-enterprise';</code>
        </div>
        <div class="surface__facts" aria-label="Gantt configuration">
          <span>resourcePlanning.enabled: true</span>
          <span>daily load</span>
          <span>capacity + over-allocation</span>
        </div>
      </div>
      <p class="surface__note">
        This is the Gantt plugin projected as resource workload: resource rows,
        capacity lines, and over-allocation highlighting.
      </p>
      <div class="grid-frame">
        <div id="gantt-grid-mount"></div>
      </div>
    </section>

    <div class="distinction" role="note">
      <span aria-hidden="true">↓</span>
      Separate plugin, separate interaction model
      <span aria-hidden="true">↓</span>
    </div>

    <section
      class="surface surface--scheduler"
      id="scheduler-surface"
      data-surface="event-scheduler-resource-timeline"
      data-plugin="EventSchedulerPlugin"
    >
      <div class="surface__header">
        <div>
          <p class="surface__number">02 · The dedicated scheduler</p>
          <h2>RevoGrid Event Scheduler — resource timeline</h2>
          <code>import { EventSchedulerPlugin } from '@revolist/revogrid-enterprise';</code>
        </div>
        <div class="legend" aria-label="Scheduler markers">
          <span><i class="legend__swatch legend__swatch--overlap"></i>Overlap</span>
          <span><i class="legend__swatch legend__swatch--blocked"></i>Unavailable</span>
        </div>
      </div>
      <p class="surface__note">
        Drag <strong>Hotfix deploy</strong> from <strong>Alex Morgan</strong> to
        <strong>Nina Patel</strong>. The Aug 7 hatched cell is blocked and rejects drops.
      </p>
      <div class="interaction-status" id="interaction-status" data-state="ready" aria-live="polite">
        Ready — move Hotfix deploy to Nina on Aug 5.
      </div>
      <div class="grid-frame">
        <div id="event-scheduler-grid-mount"></div>
      </div>
    </section>

    <footer>
      RevoGrid 4.23.21 · Pro/Enterprise 2.2.13 · Visual distinction only
    </footer>
  </main>
`;

const ganttMount = document.querySelector<HTMLDivElement>('#gantt-grid-mount');
const schedulerMount = document.querySelector<HTMLDivElement>(
  '#event-scheduler-grid-mount',
);
const interactionStatus = document.querySelector<HTMLDivElement>('#interaction-status');

if (!ganttMount || !schedulerMount || !interactionStatus) {
  throw new Error('Missing benchmark surface');
}

const ganttGrid = document.createElement('revo-grid') as GanttBenchmarkGrid;
ganttGrid.id = 'gantt-grid';
ganttGrid.setAttribute('aria-label', 'RevoGrid Gantt resource-planning view');

const ganttConfig: GanttPluginConfig = {
  id: 'scheduling-surface-benchmark',
  name: 'Scheduling surface benchmark',
  version: '1',
  currency: 'USD',
  timeZone: 'UTC',
  primaryCalendarId: CALENDAR_ID,
  updatedAt: '2026-07-30T00:00:00.000Z',
  zoomPreset: 'day-week',
  scheduling: {
    taskModeDefault: 'auto',
    resourceLeveling: 'warn',
  },
  visuals: {
    showTaskLabels: true,
    shadeNonWorkingTime: true,
  },
  resourcePlanning: {
    enabled: true,
    visibleResourceIds: RESOURCES.map((resource) => resource.id),
    loadGranularity: 'day',
    capacityDisplay: 'line',
    overAllocationDisplay: 'highlight',
  },
};

ganttGrid.theme = 'compact';
ganttGrid.hideAttribution = true;
ganttGrid.plugins = [GanttPlugin];
ganttGrid.gantt = ganttConfig;
ganttGrid.ganttCalendars = [GANTT_CALENDAR];
ganttGrid.ganttResources = [...GANTT_RESOURCES];
ganttGrid.ganttAssignments = [...GANTT_ASSIGNMENTS];
ganttGrid.columns = [
  createDefaultTaskTableColumn('name'),
  createDefaultTaskTableColumn('resourceRole'),
  createDefaultTaskTableColumn('resourceCapacity'),
  createDefaultTaskTableColumn('resourceLoadSummary'),
].filter((column) => column !== undefined);
ganttMount.appendChild(ganttGrid);
ganttGrid.source = [...GANTT_TASKS];

const schedulerConfig: EventSchedulerConfig = {
  view: 'resourceTimeline',
  weekStartDate: DATE_RANGE.start,
  dateRange: DATE_RANGE,
  visibleDays: [1, 2, 3, 4, 5, 6, 0],
  slotMinutes: 1440,
  snapMinutes: 1440,
  timeRange: { start: '00:00', end: '24:00' },
  editable: true,
  allowCreate: false,
  allowMove: true,
  allowResize: false,
  allowDelete: false,
  rowSize: 68,
  resourceColumnSize: 224,
  timelineColumnSize: 124,
  eventLayout: 'stack',
  currentTimeMarker: false,
  nonWorkingTime: {
    enabled: true,
    workingDays: [1, 2, 3, 4, 5],
  },
  conflicts: {
    enabled: true,
    policy: 'mark',
    scope: 'same-resource',
    rules: {
      overlap: 'warning',
      'blocked-time': 'error',
      'outside-availability': 'error',
    },
  },
  resourceMetaFormatter: (resource) => resource.role ?? '',
  timelineHeaderFormatter: ({ date }) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00.000Z`)),
};

const schedulerGrid = document.createElement(
  'revo-grid',
) as SchedulerBenchmarkGrid;
schedulerGrid.id = 'event-scheduler-grid';
schedulerGrid.setAttribute(
  'aria-label',
  'RevoGrid Event Scheduler resource timeline',
);
schedulerGrid.theme = 'compact';
schedulerGrid.hideAttribution = true;
schedulerGrid.plugins = [EventSchedulerPlugin];
schedulerGrid.eventScheduler = schedulerConfig;
schedulerGrid.eventSchedulerResources = [...SCHEDULER_RESOURCES];
schedulerGrid.eventSchedulerEvents = [...SCHEDULER_EVENTS];
schedulerGrid.eventSchedulerAvailability = [...SCHEDULER_AVAILABILITY];
schedulerMount.appendChild(schedulerGrid);
schedulerGrid.source = [];

schedulerGrid.addEventListener('event-scheduler-event-changed', ((event: CustomEvent) => {
  const changed = event.detail?.event;
  if (changed?.id !== 'hotfix-deploy') return;
  const resource = RESOURCES.find((item) => item.id === changed.resourceId);
  interactionStatus.dataset.state = 'moved';
  interactionStatus.textContent = `Moved — Hotfix deploy is now assigned to ${resource?.name ?? changed.resourceId}.`;
}) as EventListener);
