// https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md#run-lighthouse-multiple-times
import { spawnSync } from 'child_process';
import { computeMedianRun } from 'lighthouse/lighthouse-core/lib/median-run.js';
import psi from 'psi';
// https://stackoverflow.com/a/62499498/9931154
import { createRequire } from 'module';
import { type Options } from './options.js';
const metaRequire = createRequire(import.meta.url);
const lighthouseCli = metaRequire.resolve('lighthouse/lighthouse-cli');
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import chalk from 'chalk';

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
): Promise<psi.LighthouseResult> => {
    const { data } = await psi(urlWithRun, {
        key,
        strategy: platform,
        // @ts-ignore -- this is necessary for the current setup to work but is not in the types
        category: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    });

    console.log('using PSI server');
    return data.lighthouseResult;
};

export const runPsi = async (urls: string[], options: Options) => {
    console.log('Running PageSpeed Insights...');
    const numRuns = options.num ?? NUM_RUNS;

    options.mobile && platforms.filter((url) => url === 'mobile');

    for (const url of urls) {
        for (const platform of platforms) {
            const results = [];
            for (let i = 0; i < numRuns; ++i) {
                // To prevent Google PSI API from returning the previous cached result
                const urlWithRun = `${url}?run=${uuid()}`;
                const key = options.key ?? process.env.API_KEY ?? '';
                console.log(
                    `Running ${platform} Lighthouse audit #${i + 1}${!!options.num ? ` of ${options.num}` : ''} ${
                        options.local ? 'locally' : 'on Google'
                    } for ${urlWithRun}`
                );

                try {
                    const runnerResult = options.local ? localRun(urlWithRun) : await psiRun(urlWithRun, key, platform);
                    singleOutput(runnerResult);
                    results.push(runnerResult);
                } catch (e) {
                    console.error(e);
                    continue;
                }
            }

            const median = computeMedianRun(results);
            console.log(
                `Median performance score on ${platform} was`,
                colorScore(processScore(median.categories.performance.score), true),
                '\n'
            );
        }
    }
};

const colorMap = {
    bg: {
        red: chalk.bgRed,
        redBright: chalk.bgRedBright,
        yellow: chalk.bgYellow,
        yellowBright: chalk.bgYellowBright,
        green: chalk.bgGreen,
        greenBright: chalk.bgGreenBright,
    },
    fg: {
        red: chalk.red,
        redBright: chalk.redBright,
        yellow: chalk.yellow,
        yellowBright: chalk.yellowBright,
        green: chalk.green,
        greenBright: chalk.greenBright,
    },
};

const colorScore = (score: number, bg = false) => {
    const map = bg ? colorMap.bg : colorMap.fg;
    switch (true) {
        case score < 30:
            return map.red(score);
        case score < 50:
            return map.redBright(score);
        case score < 70:
            return map.yellow(score);
        case score < 90:
            return map.yellowBright(score);
        case score < 95:
            return map.green(score);
        case score <= 100:
            return map.greenBright(score);
    }
};
const processScore = (score: object) => Math.round(parseFloat(score.toString()) * 100);

// Lab results
const singleOutput = (runnerResult: psi.LighthouseResult) => {
    fs.writeFileSync('output.json', JSON.stringify(runnerResult, null, 2));
    const { performance, seo, accessibility, 'best-practices': bestPractices } = runnerResult.categories;
    const log = console.log;
    log('\n', runnerResult.configSettings.emulatedFormFactor ?? '', runnerResult.finalUrl);
    log('performance:', colorScore(processScore(performance.score)));
    log('accessibility:', colorScore(processScore(accessibility.score)));
    log('bestPractices:', colorScore(processScore(bestPractices.score)));
    log('seo:', colorScore(processScore(seo.score)), '\n');
};
