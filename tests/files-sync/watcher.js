import chokidar from 'chokidar';
import { exec } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { access, constants } from 'fs/promises';


const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..');
const isDev = process.env.DEV !== undefined;
const envPath = isDev
    ? path.join(__dirname, '../../.env')
    : path.join(process.resourcesPath, '.env');
dotenv.config({ path: envPath });

// Get environment variables
const baseDestination = process.env.BASE_DESTINATION?.trim().replace(/^["'](.+)["']$/, '$1');
const isFullCopy = process.env.FULLCOPY?.toLowerCase() === 'true';

// Validate required environment variables
if (!baseDestination) {
    console.error(chalk.red('Error: BASE_DESTINATION is not set in .env file'));
    process.exit(1);
}

try {
    // Check path existence
    await access(baseDestination, constants.F_OK);
    // Check write permission
    await access(baseDestination, constants.W_OK);
    // Check if it's a directory
    const stats = await fs.stat(baseDestination);
    if (!stats.isDirectory()) {
        throw new Error('Error: BASE_DESTINATION path is not a directory');
    }
} catch (error) {
    // Refine error type handling
    switch (error.code) {
        case 'ENOENT':
            console.log(chalk.yellow(`Path does not exist: ${baseDestination}`));
            break;
        case 'EACCES':
            if (error.syscall === 'access') {
                console.log(chalk.yellow(`Write permission denied: ${baseDestination}`));
            } else {
                console.log(chalk.yellow(`Access denied: ${baseDestination}`));
            }
            break;
        case 'ENOTDIR':
            console.log(chalk.yellow(`Path is not a directory: ${baseDestination}`));
            break;
        default:
            console.log(chalk.yellow(`System error: ${error.message}`));
    }
    process.exit(1);
}

// Ignored patterns
const ignore = [
    'node_modules',
    'dist',
    'release',
    '.git',
    'tests/files-sync',
    '.env',
]
const ignoredPaths = Array.from(
    ignore.map(p => path.join(projectRoot, p))
)
console.log(chalk.yellow('Ignoring the following paths:'), ignoredPaths);

// normalize drive root path
function normalizePath(path) {
    if (/^[A-Za-z]:\\?$/.test(path)) {
        return path.replace(/\\$/, '');
    }
    return path;
}

// Execute sync script
function runSync() {
    console.log(chalk.yellow('Starting file synchronization...'));

    // Build command with quoted paths to handle spaces
    const command = `powershell -File sync-project.ps1 -baseDestination "${baseDestination}" ${isFullCopy ? '-FullCopy' : ''}`;

    console.log(chalk.gray(`Executing command: ${command}`));

    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(chalk.red(`Error executing sync script: ${error.message}`));
            return;
        }
        if (stderr) {
            console.error(chalk.red(`Sync script stderr: ${stderr}`));
        }
        console.log(stdout);
        console.log(chalk.green('File synchronization completed'));
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Create debounced version of sync function
const debouncedSync = debounce(runSync, 1000);

// Initialize file watcher
console.log(chalk.blue('Initializing file watcher...'));
console.log(chalk.blue(`Watching directory: ${projectRoot}`));
console.log(chalk.blue(`Destination: ${baseDestination}`));
console.log(chalk.blue(`Full copy mode: ${isFullCopy ? 'enabled' : 'disabled'}`));


const watcher = chokidar.watch(projectRoot, {
    ignored: ignoredPaths,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
    }
});

// Watch file changes
watcher
    .on('add', path => {
        console.log(chalk.green(`File ${path} has been added`));
        debouncedSync();
    })
    .on('change', path => {
        console.log(chalk.yellow(`File ${path} has been changed`));
        debouncedSync();
    })
    .on('unlink', path => {
        console.log(chalk.red(`File ${path} has been removed`));
        debouncedSync();
    })
    .on('ready', () => {
        console.log(chalk.green('Initial scan complete. Running first sync...'));
        runSync();
    })
    .on('error', error => {
        console.error(chalk.red(`Watcher error: ${error}`));
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\nClosing file watcher...'));
    watcher.close().then(() => {
        console.log(chalk.green('File watcher closed'));
        process.exit(0);
    });
});
