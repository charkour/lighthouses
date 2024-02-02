// https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md#run-lighthouse-multiple-times
import { spawnSync } from 'child_process';
// @ts-expect-error: there are no types for this package
import { computeMedianRun } from 'lighthouse/lighthouse-core/lib/median-run.js';
import psi from 'psi';
// https://stackoverflow.com/a/62499498/9931154
import { createRequire } from 'module';
import { type Options } from './options.js';
const metaRequire = createRequire(import.meta.url);
const lighthouseCli = metaRequire.resolve('lighthouse/lighthouse-cli');
import { randomUUID as uuid } from 'crypto';
import fs from 'fs';
import chalk from 'chalk';

const NUM_RUNS = 5;
const platforms = ['mobile', 'desktop'] as const;

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

const colorPlatform = (platform: string) => {
    switch (platform) {
        case 'mobile':
            return chalk.magenta(platform);
        case 'desktop':
            return chalk.cyan(platform);
        default:
            return chalk.gray(platform);
    }
};

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
        // @ts-expect-error: this is necessary for the current setup to work but does not exist in the types
        category: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    });

    return data.lighthouseResult;
};

const colorUrl = (url: string) => chalk.dim(chalk.green(chalk.underline(url)));

// Lab results
const singleOutput = (runnerResult: psi.LighthouseResult) => {
    const { performance, seo, accessibility, 'best-practices': bestPractices } = runnerResult.categories;
    const log = console.log;
    log('\n' + colorPlatform(runnerResult.configSettings.emulatedFormFactor ?? ''), colorUrl(runnerResult.finalUrl));
    log('performance:', colorScore(processScore(performance.score)));
    log('accessibility:', colorScore(processScore(accessibility.score)));
    log('bestPractices:', colorScore(processScore(bestPractices.score)));
    log('seo:', colorScore(processScore(seo.score)), '\n');
};

interface CustomResults {
    [website: string]: {
        [platform: string]: Array<{
            performance: number;
            accessibility: number;
            'best-practices': number;
            seo: number;
        }>;
    };
}

export const runPsi = async (options: Options) => {
    console.log('Running PageSpeed Insights...');
    const numRuns = options.num ?? NUM_RUNS;

    options.mobile && platforms.filter((url) => url === 'mobile');

    let customResults: CustomResults = {};

    await Promise.all(
        options.websites.map(async (url): Promise<void> => {
            for (const platform of platforms) {
                const results = [];
                for (let i = 0; i < numRuns; i++) {
                    // To prevent Google PSI API from returning the previous cached result
                    const urlWithRun = `${url}?run=${uuid()}`;
                    const key = options.key ?? process.env.API_KEY ?? '';
                    console.log(
                        'Running',
                        colorPlatform(platform),
                        `Lighthouse audit #${i + 1} of ${numRuns}`,
                        `${options.local ? 'locally' : 'on Google'}. \n${colorUrl(urlWithRun)}:`
                    );

                    try {
                        const runnerResult = options.local
                            ? localRun(urlWithRun)
                            : await psiRun(urlWithRun, key, platform);
                        results.push(runnerResult);
                        singleOutput(runnerResult);
                    } catch (e) {
                        console.error(e);
                        continue;
                    }
                }

                const median = computeMedianRun(results);
                console.log(
                    `Median performance score on`,
                    colorPlatform(platform),
                    'for',
                    colorUrl(url),
                    'was',
                    colorScore(processScore(median.categories.performance.score), true),
                    '\n'
                );

                customResults = results.reduce((acc, curr) => {
                    const { performance, seo, accessibility, 'best-practices': bestPractices } = curr.categories;
                    acc[url] = {
                        ...customResults[url],
                        [platform]: [
                            ...(acc[url]?.[platform] ?? []),
                            {
                                'median-performance': processScore(median.categories.performance.score),
                                performance: processScore(performance.score),
                                accessibility: processScore(accessibility.score),
                                'best-practices': processScore(bestPractices.score),
                                seo: processScore(seo.score),
                            },
                        ],
                    };
                    return acc;
                }, customResults);
            }
        })
    );
    console.log('Writing results to file...');
    fs.mkdirSync('results', { recursive: true });
    const now = new Date();
    const split = now.toISOString().split('T');

    fs.writeFileSync(
        `./results/${split[0]}T${split[1].replace(/[:.]/g, '-')}.json`,
        JSON.stringify(customResults, null, 2)
    );
};
