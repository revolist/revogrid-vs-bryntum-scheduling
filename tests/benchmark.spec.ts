import { expect, test, type Locator, type Page } from '@playwright/test';

const hotfix = (page: Page) =>
  page.locator('[data-event-scheduler-event-id="hotfix-deploy"]').first();

const cell = (page: Page, resource: string, date: string) =>
  page
    .locator(
      `[data-event-scheduler-resource="${resource}"]` +
        `[data-event-scheduler-date="${date}"]` +
        '[data-event-scheduler-slot="0"]:visible',
    )
    .first();

async function drag(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Missing drag geometry');

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
}

async function projectedHotfix(page: Page) {
  return page.locator('#event-scheduler-grid').evaluate(async (grid: any) => {
    const plugins = await grid.getPlugins();
    const scheduler = plugins.find(
      (plugin: any) => typeof plugin.getProjection === 'function',
    );
    return scheduler.getProjection().events.find(
      (event: any) => event.id === 'hotfix-deploy',
    );
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#event-scheduler-grid')).toBeVisible();
});

test('shows the Gantt resource view and dedicated Scheduler', async ({ page }) => {
  await expect(page.locator('#gantt-surface')).toHaveAttribute(
    'data-plugin',
    'GanttPlugin',
  );
  await expect(page.locator('#scheduler-surface')).toHaveAttribute(
    'data-plugin',
    'EventSchedulerPlugin',
  );
  await expect(page.locator('#gantt-surface code')).toContainText('GanttPlugin');
  await expect(page.locator('#scheduler-surface code')).toContainText(
    'EventSchedulerPlugin',
  );

  const state = await page.evaluate(async () => {
    const gantt = document.querySelector<any>('#gantt-grid');
    const scheduler = document.querySelector<any>('#event-scheduler-grid');
    const ganttPlugins = await gantt.getPlugins();
    const schedulerPlugins = await scheduler.getPlugins();
    return {
      ganttPlugin: ganttPlugins.some(
        (plugin: any) => typeof plugin.applyGantt === 'function',
      ),
      schedulerPlugin: schedulerPlugins.some(
        (plugin: any) => typeof plugin.getProjection === 'function',
      ),
      resourcePlanning: gantt.gantt.resourcePlanning,
      schedulerView: scheduler.eventScheduler.view,
    };
  });

  expect(state).toMatchObject({
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

  await expect(page.locator('.event-scheduler-resource-cell__name')).toHaveText([
    'Alex Morgan',
    'Nina Patel',
    'Ravi Chen',
    'Sam Ortiz',
    'Lisa Wong',
  ]);
});

test('moves Hotfix deploy from Alex to Nina', async ({ page }) => {
  await drag(page, hotfix(page), cell(page, 'nina', '2026-08-05'));

  await expect(
    page.locator(
      '[data-event-scheduler-event-id="hotfix-deploy"]' +
        '[data-event-scheduler-resource-id="nina"]',
    ),
  ).toBeVisible();
  await expect(page.locator('#status')).toContainText('Nina Patel');
  await expect.poll(() => projectedHotfix(page)).toMatchObject({
    resourceId: 'nina',
    startDateTime: '2026-08-05T00:00:00.000Z',
    endDateTime: '2026-08-06T00:00:00.000Z',
  });
});

test('marks overlap and rejects a blocked-time drop', async ({ page }) => {
  const unavailableLegend = page.locator('.blocked');
  await expect(unavailableLegend).toHaveText('Pink = unavailable');
  await expect(unavailableLegend).toHaveCSS(
    'background-color',
    'rgb(253, 232, 232)',
  );
  await expect(unavailableLegend).toHaveCSS('background-image', 'none');

  await expect(hotfix(page)).toHaveAttribute(
    'data-event-scheduler-conflict-types',
    /overlap/,
  );

  const blocked = cell(page, 'nina', '2026-08-07');
  await expect(blocked).toHaveAttribute(
    'data-event-scheduler-availability-kind',
    'blocked',
  );

  const before = await projectedHotfix(page);
  await drag(page, hotfix(page), blocked);
  expect(await projectedHotfix(page)).toEqual(before);
  await expect(hotfix(page)).toHaveAttribute(
    'data-event-scheduler-resource-id',
    'alex',
  );
});
