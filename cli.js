#!/usr/bin/env node

import meow from "meow";
import { runPsi } from "./index.js";
import "dotenv/config";

const cli = meow(
  `
	Usage
	  $ node cli.js <input> [options]

	Options
	  --help, h Print this output
	  --key, k Add an Google API Key
	  --local, l Run the tests on your local machine
`,
  {
    importMeta: import.meta,
    flags: {
      help: {
        type: "boolean",
        alias: "h",
      },
      key: {
        type: "string",
        alias: "k",
      },
      local: {
        type: "boolean",
        alias: "l",
      },
    },
  }
);

if (!cli.input[0]) {
  console.error("Specify a URL: $ node cli.js www.example.com");
  process.exit(1);
}

runPsi(cli.input[0], cli.flags);
