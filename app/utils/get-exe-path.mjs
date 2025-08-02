import { join } from 'path';
import { __dirname } from './app-dir-name.mjs';
import fs from 'fs';

export const getExecutablePath = (filename) => {
    if (process.env.DEV) {
        return join(__dirname, filename);
    } else {
        const unpackedPath = join(__dirname, '..', '..','app.asar.unpacked', 'app', filename);
        console.log('unpackedPath', unpackedPath);
        const regularPath = join(__dirname, filename);

        return fs.existsSync(unpackedPath) ? unpackedPath : regularPath;
    }
}