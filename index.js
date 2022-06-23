// https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md#run-lighthouse-multiple-times
import { spawnSync } from "child_process";
// https://stackoverflow.com/a/62499498/9931154
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const lighthouseCli = require.resolve('lighthouse/lighthouse-cli');

import { computeMedianRun } from "lighthouse/lighthouse-core/lib/median-run.js";
import psi from "psi";

const NUM_RUNS = 5;

export const runPsi = async (url, options) => {
  console.log("Running PageSpeed Insights...");
  const results = [];
  console.log(options); 
  
  for (let i = 0; i < NUM_RUNS; i++) {
    const key = options.key ?? process.env.API_KEY ?? "";
    console.log(`Running Lighthouse attempt #${i + 1}...`);

    // TODO: remove this let
    let runnerResult;

    if (options.local) {
      console.log('run locally')
      const { status = -1, stdout } = spawnSync("node", [
        lighthouseCli,
        "--config-path=./node_modules/lighthouse/lighthouse-core/config/lr-desktop-config.js",
        "https://www.tekton.com",
        '--chromeFlags="--headless"',
        "--output=json",
        "--throttling.rttMs=40",
        "--throttling.throughputKbps=10240",
        // https://lighthouse-cpu-throttling-calculator.vercel.app/
        "--throttling.cpuSlowdownMultiplier=6",
      ]);
      if (status !== 0) {
        console.log("Lighthouse failed, skipping run...");
        continue;
      }
      runnerResult = JSON.parse(stdout);
    } else {
      console.log('run on google')
      const { data } = await psi(url, {
        key,
        strategy: "desktop",
        category: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
          "pwa",
        ],
      });

      runnerResult = data.lighthouseResult;
    }

    singleOutput(runnerResult);
    results.push(runnerResult);
  }

  const median = computeMedianRun(results);
  console.log(
    "Median performance score was",
    median.categories.performance.score * 100
  );
};

const singleOutput = (runnerResult) => {
  const {
    performance,
    seo,
    accessibility,
    "best-practices": bestPractices,
    pwa,
  } = runnerResult.categories;
  console.log({
    performance: performance.score * 100,
    accessibility: accessibility.score * 100,
    "best-practices": bestPractices.score * 100,
    seo: seo.score * 100,
  });
};
