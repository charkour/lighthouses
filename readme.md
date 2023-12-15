# Lighthouses

A simple script to run multiple lighthouse audits on multiple sites.

## Installation

1. Clone the repo
2. Run `pnpm install`
3. Run `bun run cli.ts -h` to see the options

usage: `bun run ./cli.ts [options]`

example: `bun run ./cli.ts -w list.txt -n 6`
where list.txt looks like this:

```plaintext
www.example.com
www.google.com
```

## .env

Create a root `.env` file with the following:

- `API_KEY`: Google API Key - Go to the google developer console, make a new project, and then create new credentials. Give it the restrictions of the PageSpeed Insights API
