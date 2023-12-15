#!/usr/bin/env node
import fs from 'fs';

import { runPsi } from './index.js';
import 'dotenv/config';
import { program } from 'commander';
import { Options, keyOption, localOption, mobileOption, numOption, websitesOption } from './options.js';

program
    .addOption(keyOption)
    .addOption(localOption)
    .addOption(numOption)
    .addOption(websitesOption)
    .addOption(mobileOption)
    .action(async (options: Options) => {
        console.log('options (parsed) :>>', options);
        await runPsi(options.websites, options);
    })
    .parseAsync();
