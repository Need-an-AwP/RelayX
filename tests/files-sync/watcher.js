import chokidar from 'chokidar';
import { exec } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';


const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..');
const isDev = process.env.DEV !== undefined;
const envPath = isDev
    ? path.join(__dirname, '../../.env')
    : path.join(process.resourcesPath, '.env');
dotenv.config({ path: envPath });

// 获取环境变量
const baseDestination = process.env.BASE_DESTINATION?.trim().replace(/^["'](.+)["']$/, '$1');
const isFullCopy = process.env.FULLCOPY?.toLowerCase() === 'true';

// 验证必要的环境变量
if (!baseDestination) {
    console.error(chalk.red('Error: BASE_DESTINATION is not set in .env file'));
    process.exit(1);
}


// 忽略的文件和目录
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

// 执行同步脚本
function runSync() {
    console.log(chalk.yellow('Starting file synchronization...'));

    // 构建命令，使用引号包裹路径以处理空格
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

// 防抖函数
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

// 创建防抖版本的同步函数
const debouncedSync = debounce(runSync, 1000);

// 初始化文件监控
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

// 监听文件变化事件
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

// 优雅退出
process.on('SIGINT', () => {
    console.log(chalk.yellow('\nClosing file watcher...'));
    watcher.close().then(() => {
        console.log(chalk.green('File watcher closed'));
        process.exit(0);
    });
});
