# Lighthouses

A simple script to run multiple lighthouse audits on multiple sites.

## Installation

1. Clone the repo
2. Run `npm install`
3. Run `node cli.js -h` to see the options

usage: `node cli.js <input> [options]`

example: `node cli.js www.example.com www.google.com -n 6`

typical: `node cli.js -w list.txt`

## .env

Create a root `.env` file with the following:

- `API_KEY`: Google API Key - Go to the google developer console, make a new project, and then create new credentials. Give it the restrictions of the PageSpeed Insights API
