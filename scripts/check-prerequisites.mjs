#!/usr/bin/env node

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, '..', 'app');

const requiredFiles = [
    'process-audio-capture.exe',
    'tailscale-webrtc-gateway.exe'
];

let allFilesExist = true;

for (const file of requiredFiles) {
    const filePath = join(appDir, file);
    if (!existsSync(filePath)) {
        console.log(chalk.red(`✗ ${file} does not exist`));
        if (file === 'tailscale-webrtc-gateway.exe') {
            console.log(chalk.yellow("couldn't find twg subprocess executable file in ./app, please run `yarn build:go` first"));
        }else if (file === 'process-audio-capture.exe') {
            console.log(chalk.yellow("couldn't find cpa subprocess executable file in ./app, please run `yarn downloadCPA` first"));
        }
        allFilesExist = false;
        process.exit(1);
    }
}


console.log(chalk.green('pre-requests check passed'));