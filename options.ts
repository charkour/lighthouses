import { Option } from 'commander';

export const keyOption = new Option(
  '-k, --key <key>',
  'Add an Google API Key (optional, defaults to no key)'
);

export const localOption = new Option(
  '-l, --local',
  'Run the tests on your local machine (optional, defaults to Google)'
);

export const numOption = new Option(
  '-n, --num <num>',
  'Number of runs (optional, defaults to 5)'
);

export const websitesOption = new Option(
  '-w, --websites <websites>',
  'List of URLs to audit separated by a newline \\n'
);

export const mobileOption = new Option(
  '-m, --mobile',
  'Runs only a mobile audit'
);

export type Options = {
  key?: string;
  local?: boolean;
  number?: number;
  websites?: string;
  mobile?: boolean;
};
