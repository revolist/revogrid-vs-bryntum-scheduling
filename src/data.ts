import type {
  AssignmentEntity,
  CalendarEntity,
  EventSchedulerAvailabilityEntity,
  EventSchedulerEventEntity,
  EventSchedulerResourceEntity,
  GanttTaskSourceRow,
  ISODateString,
  ResourceEntity,
} from '@revolist/revogrid-enterprise';

export const DATE_RANGE = { start: '2026-08-03', end: '2026-08-09' };
export const CALENDAR_ID = 'benchmark-calendar';

export const resources = [
  { id: 'alex', name: 'Alex Morgan', role: 'Lead engineer' },
  { id: 'nina', name: 'Nina Patel', role: 'Product designer' },
  { id: 'ravi', name: 'Ravi Chen', role: 'QA engineer' },
  { id: 'sam', name: 'Sam Ortiz', role: 'Technical writer' },
  { id: 'lisa', name: 'Lisa Wong', role: 'Project manager' },
];

type DemoEvent = ReturnType<typeof event>;

function event(
  id: string,
  title: string,
  resourceId: string,
  start: string,
  end: string,
  confirmed = false,
) {
  return {
    id,
    title,
    resourceId,
    startDateTime: `${start}T00:00:00.000Z`,
    endDateTime: `${end}T00:00:00.000Z`,
    confirmed,
  };
}

export const events = [
  event('payment-gateway', 'Payment gateway', 'alex', '2026-08-03', '2026-08-06', true),
  event('hotfix-deploy', 'Hotfix deploy', 'alex', '2026-08-05', '2026-08-06'),
  event('design-handoff', 'Design handoff', 'nina', '2026-08-03', '2026-08-05', true),
  event('regression-pass', 'Regression pass', 'ravi', '2026-08-05', '2026-08-08'),
  event('release-notes', 'Release notes', 'sam', '2026-08-04', '2026-08-06'),
  event('launch-coordination', 'Launch coordination', 'lisa', '2026-08-06', '2026-08-10', true),
];

export const ganttCalendar: CalendarEntity = {
  id: CALENDAR_ID,
  name: 'Standard week',
  timeZone: 'UTC',
  workingDays: [1, 2, 3, 4, 5],
  holidays: [],
  hoursPerDay: 8,
};

export const ganttResources: ResourceEntity[] = resources.map((resource) => ({
  ...resource,
  calendarId: CALENDAR_ID,
  allocationCapacity: 100,
  hourlyCost: 100,
}));

const dateOnly = (dateTime: string) =>
  dateTime.slice(0, 10) as ISODateString;

function previousDay(dateTime: string): ISODateString {
  const date = new Date(dateTime);
  date.setUTCDate(date.getUTCDate() - 1);
  return dateOnly(date.toISOString());
}

function workHours({ startDateTime, endDateTime }: DemoEvent) {
  const cursor = new Date(startDateTime);
  const end = new Date(endDateTime);
  let weekdays = 0;
  while (cursor < end) {
    if (![0, 6].includes(cursor.getUTCDay())) weekdays += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return Math.max(1, weekdays) * 8;
}

export const ganttTasks: GanttTaskSourceRow[] = events.map((item) => ({
  id: item.id,
  name: item.title,
  startDate: dateOnly(item.startDateTime),
  endDate: previousDay(item.endDateTime),
  percentDone: item.confirmed ? 60 : 20,
  calendarId: CALENDAR_ID,
  tags: [],
}));

export const ganttAssignments: AssignmentEntity[] = events.map((item) => ({
  id: `assignment-${item.id}`,
  taskId: item.id,
  resourceId: item.resourceId,
  allocationUnits: 100,
  workHours: workHours(item),
  responsibility: 'Owner',
}));

export const schedulerResources: EventSchedulerResourceEntity[] = resources.map(
  (resource) => ({ ...resource, capacity: 1 }),
);

export const schedulerEvents: EventSchedulerEventEntity[] = events.map(
  ({ confirmed: _, ...item }) => item,
);

export const schedulerAvailability: EventSchedulerAvailabilityEntity[] = [
  {
    id: 'nina-blocked',
    resourceId: 'nina',
    kind: 'blocked',
    title: 'Unavailable',
    reason: 'Nina is unavailable',
    startDateTime: '2026-08-07T00:00:00.000Z',
    endDateTime: '2026-08-08T00:00:00.000Z',
  },
];
