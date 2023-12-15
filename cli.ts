#!/usr/bin/env node
import fs from 'fs';

import { runPsi } from './index.js';
import 'dotenv/config';
import { Option, program } from 'commander';
import {
  Options,
  keyOption,
  localOption,
  mobileOption,
  numOption,
  websitesOption,
} from './options.js';

const getListOfWebsites = (options: Options): string[] => {
  if (options.websites) {
    try {
      const data = fs
        .readFileSync(options.websites, 'utf8')
        .split('\n')
        .filter((value) => !!value && !value.startsWith('//'));
      return data;
    } catch (err) {
      console.error(err);
    }
  }
  return [options.websites];
};

program
  .addOption(keyOption)
  .addOption(localOption)
  .addOption(numOption)
  .addOption(websitesOption)
  .addOption(mobileOption)
  .action(async (options: Options) => {
    console.log(`[cli.ts] options :>> ${options}`, options);
    const websites = getListOfWebsites(options);
    if (!websites || !websites.length) {
      console.error('Specify a URL: $ node cli.js www.example.com');
      process.exit(1);
    }

    await runPsi(websites, options);
  })
  .parseAsync();
