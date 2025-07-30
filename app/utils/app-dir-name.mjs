import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = process.env.DEV ?
    dirname(dirname(__filename)) :
    dirname(dirname(__filename));
console.log('current __dirname:', __dirname);

export default __dirname;