import { expect, test, type Locator, type Page } from '@playwright/test';

async function dragTo(page: Page, source: Locator, target: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Missing scheduler drag geometry');

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();
}

async function schedulerEvent(page: Page, eventId: string) {
  return page.locator('#event-scheduler-grid').evaluate(async (grid: any, id) => {
    const plugins = await grid.getPlugins();
    const plugin = plugins.find((item: any) => {
      if (typeof item.getProjection !== 'function') return false;
      return item.getProjection()?.config?.view === 'resourceTimeline';
    });
    return plugin.getProjection().events.find((item: any) => item.id === id);
  }, eventId);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#event-scheduler-grid')).toBeVisible();
});

test('identifies both plugins and renders their intended resource views', async ({ page }) => {
  await expect(
    page.getByRole('heading', {
      name: 'RevoGrid Gantt — resource-planning view',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'RevoGrid Event Scheduler — resource timeline',
    }),
  ).toBeVisible();
  await expect(page.locator('#gantt-surface')).toHaveAttribute(
    'data-plugin',
    'GanttPlugin',
  );
  await expect(page.locator('#scheduler-surface')).toHaveAttribute(
    'data-plugin',
    'EventSchedulerPlugin',
  );

  const identities = await page.evaluate(async () => {
    const gantt = document.querySelector<any>('#gantt-grid');
    const scheduler = document.querySelector<any>('#event-scheduler-grid');
    const ganttPlugins = await gantt.getPlugins();
    const schedulerPlugins = await scheduler.getPlugins();
    return {
      ganttPlugin: ganttPlugins.some(
        (plugin: any) =>
          typeof plugin.applyGantt === 'function' &&
          typeof plugin.captureBaseline === 'function',
      ),
      schedulerPlugin: schedulerPlugins.some((plugin: any) => {
        if (typeof plugin.getProjection !== 'function') return false;
        return plugin.getProjection()?.config?.view === 'resourceTimeline';
      }),
      resourcePlanning: gantt.gantt.resourcePlanning,
      schedulerView: scheduler.eventScheduler.view,
    };
  });

  expect(identities).toMatchObject({
    ganttPlugin: true,
    schedulerPlugin: true,
    schedulerView: 'resourceTimeline',
    resourcePlanning: {
      enabled: true,
      loadGranularity: 'day',
      capacityDisplay: 'line',
      overAllocationDisplay: 'highlight',
    },
  });

  for (const resource of [
    'Alex Morgan',
    'Nina Patel',
    'Ravi Chen',
    'Sam Ortiz',
    'Lisa Wong',
  ]) {
    await expect(
      page.locator('.event-scheduler-resource-cell__name', { hasText: resource }),
    ).toBeVisible();
  }
});

test('moves Hotfix deploy from Alex Morgan to Nina Patel', async ({ page }) => {
  const hotfix = page
    .locator(
      '#event-scheduler-grid .event-scheduler-event[data-event-scheduler-event-id="hotfix-deploy"]',
    )
    .first();
  const ninaAug5 = page
    .locator(
      '#event-scheduler-grid [data-event-scheduler-resource="nina"][data-event-scheduler-date="2026-08-05"][data-event-scheduler-slot="0"]:visible',
    )
    .first();

  await dragTo(page, hotfix, ninaAug5);

  await expect(
    page.locator(
      '#event-scheduler-grid .event-scheduler-event[data-event-scheduler-event-id="hotfix-deploy"][data-event-scheduler-resource-id="nina"]',
    ),
  ).toBeVisible();
  await expect(page.locator('#interaction-status')).toContainText('Nina Patel');
  await expect.poll(() => schedulerEvent(page, 'hotfix-deploy')).toMatchObject({
    id: 'hotfix-deploy',
    resourceId: 'nina',
    startDateTime: '2026-08-05T00:00:00.000Z',
    endDateTime: '2026-08-06T00:00:00.000Z',
  });
});

test('marks overlap and unavailable time, and rejects a blocked drop', async ({ page }) => {
  const overlap = page
    .locator(
      '#event-scheduler-grid .event-scheduler-event[data-event-scheduler-event-id="hotfix-deploy"]',
    )
    .first();
  await expect(overlap).toHaveAttribute(
    'data-event-scheduler-conflict-types',
    /overlap/,
  );
  await expect(overlap).toHaveAttribute(
    'data-event-scheduler-conflict-severity',
    'warning',
  );

  const blocked = page
    .locator(
      '#event-scheduler-grid [data-event-scheduler-resource="nina"][data-event-scheduler-date="2026-08-07"][data-event-scheduler-slot="0"]:visible',
    )
    .first();
  await expect(blocked).toHaveAttribute(
    'data-event-scheduler-availability-kind',
    'blocked',
  );
  await expect(blocked).toHaveAttribute(
    'data-event-scheduler-availability-reason',
    'Nina is unavailable',
  );

  const before = await schedulerEvent(page, 'hotfix-deploy');
  await dragTo(page, overlap, blocked);
  const after = await schedulerEvent(page, 'hotfix-deploy');

  expect(after).toEqual(before);
  await expect(
    page.locator(
      '#event-scheduler-grid .event-scheduler-event[data-event-scheduler-event-id="hotfix-deploy"][data-event-scheduler-resource-id="alex"]',
    ),
  ).toBeVisible();
});
