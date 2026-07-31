import { defineCustomElements } from '@revolist/revogrid/loader';
import {
  createDefaultTaskTableColumn,
  type EventSchedulerConfig,
  type GanttPluginConfig,
} from '@revolist/revogrid-enterprise';
import { GanttPlugin } from '@revolist/revogrid-enterprise';
import { EventSchedulerPlugin } from '@revolist/revogrid-enterprise';
import {
  CALENDAR_ID,
  DATE_RANGE,
  ganttAssignments,
  ganttCalendar,
  ganttResources,
  ganttTasks,
  resources,
  schedulerAvailability,
  schedulerEvents,
  schedulerResources,
} from './data';
import '@revolist/revogrid-pro/dist/rv-pro-trial.css';
import '@revolist/revogrid-enterprise/dist/rv-enterprise-trial.css';
import './styles.css';

defineCustomElements();

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app');

app.innerHTML = `
  <main>
    <header>
      <h1>Two RevoGrid scheduling surfaces</h1>
      <p>The same five resources and six events are shown in both plugins.</p>
    </header>

    <section id="gantt-surface" data-plugin="GanttPlugin">
      <small>1. What Bryntum tested</small>
      <h2>RevoGrid Gantt — resource-planning view</h2>
      <code>import { GanttPlugin } from '@revolist/revogrid-enterprise';</code>
      <p>Resource rows, daily load, capacity lines, and over-allocation.</p>
      <div class="demo-grid-frame"><div id="gantt-mount"></div></div>
    </section>

    <section id="scheduler-surface" data-plugin="EventSchedulerPlugin">
      <small>2. The dedicated scheduler</small>
      <h2>RevoGrid Event Scheduler — resource timeline</h2>
      <code>import { EventSchedulerPlugin } from '@revolist/revogrid-enterprise';</code>
      <p>
        Drag <strong>Hotfix deploy</strong> from Alex to Nina on Aug 5.
        <span class="overlap">Orange = overlap</span>
        <span class="blocked">Pink = unavailable</span>
      </p>
      <output id="status">Ready — move Hotfix deploy to Nina.</output>
      <div class="demo-grid-frame"><div id="scheduler-mount"></div></div>
    </section>
  </main>
`;

function createGrid(
  id: string,
  plugin: typeof GanttPlugin | typeof EventSchedulerPlugin,
) {
  const grid = document.createElement('revo-grid');
  Object.assign(grid, {
    id,
    theme: 'compact',
    hideAttribution: true,
    plugins: [plugin],
  });
  return grid;
}

function mountGrid(
  mountId: string,
  grid: HTMLRevoGridElement,
  source: HTMLRevoGridElement['source'],
) {
  document.querySelector(`#${mountId}`)?.append(grid);
  grid.source = source;
}

const ganttConfig: GanttPluginConfig = {
  id: 'benchmark',
  name: 'Scheduling benchmark',
  version: '1',
  currency: 'USD',
  timeZone: 'UTC',
  primaryCalendarId: CALENDAR_ID,
  updatedAt: '2026-07-30T00:00:00.000Z',
  zoomPreset: 'day-week',
  resourcePlanning: {
    enabled: true,
    visibleResourceIds: resources.map(({ id }) => id),
    loadGranularity: 'day',
    capacityDisplay: 'line',
    overAllocationDisplay: 'highlight',
  },
};

const gantt = Object.assign(createGrid('gantt-grid', GanttPlugin), {
  gantt: ganttConfig,
  ganttCalendars: [ganttCalendar],
  ganttResources,
  ganttAssignments,
  columns: [
    createDefaultTaskTableColumn('name'),
    createDefaultTaskTableColumn('resourceRole'),
    createDefaultTaskTableColumn('resourceLoadSummary'),
  ].filter(Boolean),
});
mountGrid('gantt-mount', gantt, ganttTasks);

const schedulerConfig: EventSchedulerConfig = {
  view: 'resourceTimeline',
  weekStartDate: DATE_RANGE.start,
  dateRange: DATE_RANGE,
  slotMinutes: 1440,
  snapMinutes: 1440,
  timeRange: { start: '00:00', end: '24:00' },
  editable: true,
  allowMove: true,
  rowSize: 68,
  resourceColumnSize: 210,
  timelineColumnSize: 124,
  eventLayout: 'stack',
  currentTimeMarker: false,
  continuationLabels: false,
  eventContentTemplate: (_h, { event }) => event.title,
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
  resourceMetaFormatter: ({ role }) => role ?? '',
};

const scheduler = Object.assign(
  createGrid('event-scheduler-grid', EventSchedulerPlugin),
  {
    eventScheduler: schedulerConfig,
    eventSchedulerResources: schedulerResources,
    eventSchedulerEvents: schedulerEvents,
    eventSchedulerAvailability: schedulerAvailability,
  },
);
mountGrid('scheduler-mount', scheduler, []);

scheduler.addEventListener('event-scheduler-event-changed', (event) => {
  const changed = (event as CustomEvent).detail?.event;
  if (changed?.id !== 'hotfix-deploy') return;
  const name = resources.find(({ id }) => id === changed.resourceId)?.name;
  document.querySelector('#status')!.textContent =
    `Moved — Hotfix deploy is assigned to ${name}.`;
});
