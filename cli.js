#!/usr/bin/env node
import fs from "fs";

import meow from "meow";
import { runPsi } from "./index.js";
import "dotenv/config";

const cli = meow(
  `
	Usage
	  $ node cli.js <input> [options]

	Options
	  --help, h Print this output (optional)
	  --key, k Add an Google API Key (optional, defaults to no key)
	  --local, l Run the tests on your local machine (optional, defaults to Google)
	  --num, n Number of runs (optional, defaults to 5)
    --websites, w List of URLs to audit separated by a newline \\n
    --mobile, -m Runs only a mobile audit
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
      number: {
        type: "number",
        alias: "n",
      },
      websites: {
        type: "string",
        alias: "w",
      },
      mobile: {
        type: "boolean",
        alias: "m",
      }
    },
  }
);

const getListOfWebsites = (cli) => {
  if (cli.flags.websites) {
    try {
      const data = fs
        .readFileSync(cli.flags.websites, "utf8")
        .split("\n")
        .filter((value) => !!value && !value.startsWith("//"));
      return data;
    } catch (err) {
      console.error(err);
    }
  }
  return cli.input;
};

const websites = getListOfWebsites(cli);

if (!websites.length) {
  console.error("Specify a URL: $ node cli.js www.example.com");
  process.exit(1);
}

runPsi(websites, cli.flags);
