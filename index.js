// https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md#run-lighthouse-multiple-times
import { spawnSync } from "child_process";
import { computeMedianRun } from "lighthouse/lighthouse-core/lib/median-run.js";
import psi from "psi";
// https://stackoverflow.com/a/62499498/9931154
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lighthouseCli = require.resolve("lighthouse/lighthouse-cli");

const NUM_RUNS = 5;
const platforms = ["mobile", "desktop"];

export const runPsi = async (urls, options) => {
  console.log("Running PageSpeed Insights...");
  const numRuns = options.number ?? NUM_RUNS;

  options.mobile && platforms.filter((url) => url === 'mobile');

  for (const url of urls) {
    for (const platform of platforms) {
      const results = [];
      for (let i = 0; i < numRuns; i++) {
        // To prevent Google PSI API from returning the previous cached result
        const urlWithRun = `${url}?run=${i}`;
        const key = options.key ?? process.env.API_KEY ?? "";
        console.log(
          `Running ${platform} Lighthouse audit #${i + 1} ${
            options.local ? "locally" : "on Google"
          } for ${urlWithRun}`
        );

        // TODO: remove this let
        let runnerResult;

        if (options.local) {
          // TODO: allow local to simulate mobile. Will only simulate desktop.
          const { status = -1, stdout } = spawnSync("node", [
            lighthouseCli,
            "--config-path=./node_modules/lighthouse/lighthouse-core/config/lr-desktop-config.js",
            urlWithRun,
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
          const { data } = await psi(urlWithRun, {
            key,
            strategy: platform,
            category: [
              "performance",
              "accessibility",
              "best-practices",
              "seo",
              "pwa",
            ],
          });

          runnerResult = data.lighthouseResult;
          // TODO: output field data from PSI
          // console.log()
        }

        singleOutput(runnerResult);
        results.push(runnerResult);
      }

      const median = computeMedianRun(results);
      console.log(
        "Median performance score was",
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
    "best-practices": bestPractices,
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
