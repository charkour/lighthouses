import chalk from 'chalk';
import { Option } from 'commander';
import fs from 'fs';

export const websitesOptionError = () => {
    console.error(
        chalk.redBright('Specify a website URL or a newline-separated list of URLs:'),
        '$ bun run ./cli.ts ',
        chalk.yellow(chalk.dim('-w <www.example.com | list.txt>'))
    );

    process.exit(1);
};

const intParser = (val: string) => parseInt(val);

const getListOfWebsites = (sites: string): string[] => {
    if (sites) {
        try {
            const data = fs
                .readFileSync(sites, 'utf8')
                .split('\n')
                .filter((value) => !!value && !value.startsWith('//'));
            return data;
        } catch (err) {
            console.warn(`Could not read file ${sites}, using ${sites} as a URL`);
        }
    }
    return [sites];
};

export const verboseOption = new Option('-v --verbose');

export const keyOption = new Option('-k, --key <key>', 'Add an Google API Key (optional, defaults to no key)');

export const localOption = new Option(
    '-l, --local',
    'Run the tests on your local machine (optional, defaults to Google)'
);

export const numOption = new Option('-n, --num <num>', 'Number of runs (optional, defaults to 5)').argParser(intParser);

export const websitesOption = new Option(
    '-w, --websites <websites>',
    'List of URLs to audit separated by a newline \\n'
).argParser((sites) => {
    const websites = getListOfWebsites(sites);
    if (!websites || !websites.length) {
        websitesOptionError();
    }
    return websites;
});

export const mobileOption = new Option('-m, --mobile', 'Runs only a mobile audit');

export type Options = {
    key?: string;
    local?: boolean;
    num?: number;
    websites: string[];
    mobile?: boolean;
    verbose?: boolean;
};
