// https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md#run-lighthouse-multiple-times
const spawnSync = require("child_process").spawnSync;
const lighthouseCli = require.resolve("lighthouse/lighthouse-cli");
const computeMedianRun =
  require("lighthouse/lighthouse-core/lib/median-run.js").computeMedianRun;
const psi = require("psi");

const NUM_RUNS = 5;

(async () => {
  const results = [];
  for (let i = 0; i < NUM_RUNS; i++) {
    const { data } = await psi("https://www.tekton.com", {
      // key: "XXX",
      strategy: "desktop",
      category: [
        "performance",
        "accessibility",
        "best-practices",
        "seo",
        "pwa",
      ],
    });

    const runnerResult = data.lighthouseResult;
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
      bestPractices: bestPractices.score * 100,
      seo: seo.score * 100,
    });
    results.push(runnerResult);
  }

  const median = computeMedianRun(results);
  console.log(
    "Median performance score was",
    median.categories.performance.score * 100
  );
})();

// Run it locally

// const results = [];
// for (let i = 0; i < 5; i++) {
//   console.log(`Running Lighthouse attempt #${i + 1}...`);
//   const { status = -1, stdout } = spawnSync("node", [
//     lighthouseCli,
//     "--config-path=./node_modules/lighthouse/lighthouse-core/config/lr-desktop-config.js",
//     "https://www.tekton.com",
//     '--chromeFlags="--headless"',
//     "--output=json",
//     "--throttling.rttMs=40",
//     "--throttling.throughputKbps=10240",
//     // https://lighthouse-cpu-throttling-calculator.vercel.app/
//     "--throttling.cpuSlowdownMultiplier=6",
//   ]);
//   if (status !== 0) {
//     console.log("Lighthouse failed, skipping run...");
//     continue;
//   }
//   const runnerResult = JSON.parse(stdout);
//   const { benchmarkIndex } = runnerResult.environment;
//   const {
//     performance,
//     seo,
//     accessibility,
//     "best-practices": bestPractices,
//     pwa,
//   } = runnerResult.categories;
//   console.log({
//     performance: performance.score * 100,
//     accessibility: accessibility.score * 100,
//     bestPractices: bestPractices.score * 100,
//     seo: seo.score * 100,
//   });
//   results.push(runnerResult);
// }

// const median = computeMedianRun(results);
// console.log(
//   "Median performance score was",
//   median.categories.performance.score * 100
// );
