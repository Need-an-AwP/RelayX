import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(dirname(__filename));
console.log('current __dirname:', __dirname);

export const exeDirPath = 'PORTABLE_EXECUTABLE_DIR' in process.env
    ? process.env.PORTABLE_EXECUTABLE_DIR
    : dirname(process.argv[0]);
console.log('current exePath:', exeDirPath);
