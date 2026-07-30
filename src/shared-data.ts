import type {
  AssignmentEntity,
  CalendarEntity,
  EventSchedulerAvailabilityEntity,
  EventSchedulerEventEntity,
  EventSchedulerResourceEntity,
  GanttTaskSourceRow,
  ResourceEntity,
} from '@revolist/revogrid-enterprise';

export interface BenchmarkResource {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly color: string;
}

export interface BenchmarkEvent {
  readonly id: string;
  readonly title: string;
  readonly resourceId: string;
  readonly startDateTime: string;
  readonly endDateTime: string;
  readonly status: 'planned' | 'confirmed';
}

export const DATE_RANGE = {
  start: '2026-08-03',
  end: '2026-08-09',
} as const;

export const CALENDAR_ID = 'benchmark-standard';

export const RESOURCES: readonly BenchmarkResource[] = [
  { id: 'alex', name: 'Alex Morgan', role: 'Lead engineer', color: '#2563eb' },
  { id: 'nina', name: 'Nina Patel', role: 'Product designer', color: '#7c3aed' },
  { id: 'ravi', name: 'Ravi Chen', role: 'QA engineer', color: '#0891b2' },
  { id: 'sam', name: 'Sam Ortiz', role: 'Technical writer', color: '#d97706' },
  { id: 'lisa', name: 'Lisa Wong', role: 'Project manager', color: '#059669' },
];

export const EVENTS: readonly BenchmarkEvent[] = [
  {
    id: 'payment-gateway',
    title: 'Payment gateway',
    resourceId: 'alex',
    startDateTime: '2026-08-03T00:00:00.000Z',
    endDateTime: '2026-08-06T00:00:00.000Z',
    status: 'confirmed',
  },
  {
    id: 'hotfix-deploy',
    title: 'Hotfix deploy',
    resourceId: 'alex',
    startDateTime: '2026-08-05T00:00:00.000Z',
    endDateTime: '2026-08-06T00:00:00.000Z',
    status: 'planned',
  },
  {
    id: 'design-handoff',
    title: 'Design handoff',
    resourceId: 'nina',
    startDateTime: '2026-08-03T00:00:00.000Z',
    endDateTime: '2026-08-05T00:00:00.000Z',
    status: 'confirmed',
  },
  {
    id: 'regression-pass',
    title: 'Regression pass',
    resourceId: 'ravi',
    startDateTime: '2026-08-05T00:00:00.000Z',
    endDateTime: '2026-08-08T00:00:00.000Z',
    status: 'planned',
  },
  {
    id: 'release-notes',
    title: 'Release notes',
    resourceId: 'sam',
    startDateTime: '2026-08-04T00:00:00.000Z',
    endDateTime: '2026-08-06T00:00:00.000Z',
    status: 'planned',
  },
  {
    id: 'launch-coordination',
    title: 'Launch coordination',
    resourceId: 'lisa',
    startDateTime: '2026-08-06T00:00:00.000Z',
    endDateTime: '2026-08-10T00:00:00.000Z',
    status: 'confirmed',
  },
];

export const GANTT_CALENDAR: CalendarEntity = {
  id: CALENDAR_ID,
  name: 'Benchmark standard',
  timeZone: 'UTC',
  workingDays: [1, 2, 3, 4, 5],
  holidays: [],
  hoursPerDay: 8,
};

export const GANTT_RESOURCES: readonly ResourceEntity[] = RESOURCES.map((resource) => ({
  id: resource.id,
  name: resource.name,
  role: resource.role,
  calendarId: CALENDAR_ID,
  allocationCapacity: 100,
  hourlyCost: 100,
}));

function previousUtcDate(exclusiveEndDateTime: string): string {
  const date = new Date(exclusiveEndDateTime);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function workingDayCount(event: BenchmarkEvent): number {
  const cursor = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  let count = 0;
  while (cursor < end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return Math.max(1, count);
}

export const GANTT_TASKS: readonly GanttTaskSourceRow[] = EVENTS.map((event) => ({
  id: event.id,
  name: event.title,
  startDate: event.startDateTime.slice(0, 10),
  endDate: previousUtcDate(event.endDateTime),
  percentDone: event.status === 'confirmed' ? 60 : 20,
  calendarId: CALENDAR_ID,
  tags: [],
})) as unknown as readonly GanttTaskSourceRow[];

export const GANTT_ASSIGNMENTS: readonly AssignmentEntity[] = EVENTS.map((event) => ({
  id: `assignment-${event.id}`,
  taskId: event.id,
  resourceId: event.resourceId,
  allocationUnits: 100,
  workHours: workingDayCount(event) * 8,
  responsibility: 'Owner',
}));

export const SCHEDULER_RESOURCES: readonly EventSchedulerResourceEntity[] = RESOURCES.map((resource) => ({
  ...resource,
  capacity: 1,
}));

export const SCHEDULER_EVENTS: readonly EventSchedulerEventEntity[] = EVENTS.map((event) => ({
  ...event,
  color: RESOURCES.find((resource) => resource.id === event.resourceId)?.color,
}));

export const SCHEDULER_AVAILABILITY: readonly EventSchedulerAvailabilityEntity[] = [
  {
    id: 'nina-release-freeze',
    resourceId: 'nina',
    kind: 'blocked',
    title: 'Release freeze',
    reason: 'Nina is unavailable',
    startDateTime: '2026-08-07T00:00:00.000Z',
    endDateTime: '2026-08-08T00:00:00.000Z',
  },
];
