import { spawn, spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const rawVideoDirectory = resolve(root, 'assets', 'raw-video');
const webmPath = resolve(root, 'assets', 'revogrid-scheduling-surfaces.webm');
const gifPath = resolve(root, 'assets', 'revogrid-scheduling-surfaces.gif');
const serverUrl = 'http://127.0.0.1:4173';

await mkdir(rawVideoDirectory, { recursive: true });

const server = spawn(
  'pnpm',
  ['dev', '--host', '127.0.0.1', '--port', '4173'],
  { cwd: root, stdio: 'ignore' },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(serverUrl);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 125));
  }
  throw new Error('Timed out waiting for Vite');
}

async function drag(source, target, page) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Missing recording drag geometry');
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 18 },
  );
  await page.waitForTimeout(350);
  await page.mouse.up();
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: rawVideoDirectory,
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();
  const video = page.video();

  await page.goto(serverUrl, { waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: 'RevoGrid Gantt — resource-planning view' })
    .waitFor();
  await page.waitForTimeout(900);

  await page
    .getByRole('heading', { name: 'RevoGrid Gantt — resource-planning view' })
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  await page
    .getByRole('heading', {
      name: 'RevoGrid Event Scheduler — resource timeline',
    })
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

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
  await hotfix.hover();
  await page.waitForTimeout(700);
  await drag(hotfix, ninaAug5, page);
  await page.waitForTimeout(1800);

  const blocked = page
    .locator(
      '#event-scheduler-grid [data-event-scheduler-resource="nina"][data-event-scheduler-date="2026-08-07"][data-event-scheduler-slot="0"]:visible',
    )
    .first();
  await blocked.hover();
  await page.waitForTimeout(1200);

  await page.close();
  await context.close();
  if (!video) throw new Error('Playwright did not create a video');
  await video.saveAs(webmPath);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const conversion = spawnSync(
  ffmpeg,
  [
    '-y',
    '-i',
    webmPath,
    '-t',
    '10',
    '-filter_complex',
    'fps=10,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=72[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4',
    '-loop',
    '0',
    gifPath,
  ],
  { cwd: root, stdio: 'inherit' },
);

if (conversion.status !== 0) {
  throw new Error(`ffmpeg exited with status ${conversion.status}`);
}

console.log(`Recorded ${gifPath}`);
