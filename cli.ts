import fs from 'fs';

import { runPsi } from './index.js';
import 'dotenv/config';
import { program } from 'commander';
import {
    type Options,
    keyOption,
    localOption,
    mobileOption,
    numOption,
    websitesOption,
    websitesOptionError,
    verboseOption,
} from './options.js';

program
    .addOption(keyOption)
    .addOption(localOption)
    .addOption(numOption)
    .addOption(websitesOption)
    .addOption(mobileOption)
    .addOption(verboseOption)
    .action(async (options: Options) => {
        if (options.verbose) {
            console.log('options (parsed) :>>', options);
        }
        if (!options.websites) {
            websitesOptionError();
        }
        await runPsi(options);
    })
    .parseAsync();
