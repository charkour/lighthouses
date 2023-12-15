// https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md#run-lighthouse-multiple-times
import { spawnSync } from 'child_process';
import { computeMedianRun } from 'lighthouse/lighthouse-core/lib/median-run.js';
import psi from 'psi';
// https://stackoverflow.com/a/62499498/9931154
import { createRequire } from 'module';
import { Options } from './options.js';
const metaRequire = createRequire(import.meta.url);
const lighthouseCli = metaRequire.resolve('lighthouse/lighthouse-cli');

const NUM_RUNS = 5;
const platforms = ['mobile', 'desktop'] as const;

const localRun = (urlWithRun: string) => {
  // TODO: allow local to simulate mobile. Will only simulate desktop.
  const { status = -1, stdout } = spawnSync('node', [
    lighthouseCli,
    '--config-path=./node_modules/lighthouse/lighthouse-core/config/lr-desktop-config.js',
    urlWithRun,
    '--chromeFlags="--headless"',
    '--output=json',
    '--throttling.rttMs=40',
    '--throttling.throughputKbps=10240',
    // https://lighthouse-cpu-throttling-calculator.vercel.app/
    '--throttling.cpuSlowdownMultiplier=6',
  ]);
  if (status !== 0) {
    throw new Error('Lighthouse failed, skipping run...');
  }
  return JSON.parse(stdout.toString());
};

const psiRun = async (
  urlWithRun: string,
  key: string,
  platform: (typeof platforms)[number]
) => {
  const { data } = await psi(urlWithRun, {
    key,
    strategy: platform,
    //TODO: Figure out why this is necessary for the tests to run but doesn't exist in the types
    category: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
  });

  // TODO: output field data from PSI
  console.log('using PSI server');
  return data.lighthouseResult;
};

export const runPsi = async (urls: string[], options: Options) => {
  console.log('Running PageSpeed Insights...');
  const numRuns = options.number ?? NUM_RUNS;

  options.mobile && platforms.filter((url) => url === 'mobile');

  for (const url of urls) {
    for (const platform of platforms) {
      const results = [];
      for (let i = 0; i < numRuns; i++) {
        // To prevent Google PSI API from returning the previous cached result
        const urlWithRun = `${url}?run=${i}`;
        const key = options.key ?? process.env.API_KEY ?? '';
        console.log(
          `Running ${platform} Lighthouse audit #${i + 1} ${
            options.local ? 'locally' : 'on Google'
          } for ${urlWithRun}`
        );

        try {
          const runnerResult = options.local
            ? localRun(urlWithRun)
            : await psiRun(urlWithRun, key, platform);
          singleOutput(runnerResult);
          results.push(runnerResult);
        } catch (e) {
          console.error(e);
          continue;
        }
      }

      const median = computeMedianRun(results);
      console.log(
        'Median performance score was',
        Math.round(median.categories.performance.score * 100)
      );
    }
  }
};

// Lab results
const singleOutput = (runnerResult) => {
  const {
    performance,
    seo,
    accessibility,
    'best-practices': bestPractices,
    pwa,
  } = runnerResult.categories;
  // TODO: add chalk to color terminal output
  console.log(runnerResult.configSettings.formFactor, runnerResult.finalUrl, {
    performance: Math.round(performance.score * 100),
    accessibility: Math.round(accessibility.score * 100),
    bestPractices: Math.round(bestPractices.score * 100),
    seo: Math.round(seo.score * 100),
  });
};
