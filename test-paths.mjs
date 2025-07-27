import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.DEV != undefined;

// 复制主进程中的路径解析逻辑
function getExecutablePath(filename) {
    if (isDev) {
        return join(__dirname, 'app', filename);
    } else {
        // 生产环境：检查是否在 asar.unpacked 目录中
        const unpackedPath = join(__dirname, '..', 'app.asar.unpacked', 'app', filename);
        const regularPath = join(__dirname, 'app', filename);
        
        // 优先使用 unpacked 路径，如果不存在则使用常规路径
        return fs.existsSync(unpackedPath) ? unpackedPath : regularPath;
    }
}

console.log('测试环境:', isDev ? '开发环境' : '生产环境');
console.log('当前目录:', __dirname);
console.log('');

const goExePath = getExecutablePath('turn-on-tailscale.exe');
const captureExePath = getExecutablePath('process-audio-capture.exe');

console.log('Go进程路径:', goExePath);
console.log('Go进程存在:', fs.existsSync(goExePath));
console.log('');
console.log('音频捕获进程路径:', captureExePath);
console.log('音频捕获进程存在:', fs.existsSync(captureExePath));

// 如果是生产环境，还检查 asar.unpacked 目录
if (!isDev) {
    const unpackedDir = join(__dirname, '..', 'app.asar.unpacked', 'app');
    console.log('');
    console.log('Unpacked目录:', unpackedDir);
    console.log('Unpacked目录存在:', fs.existsSync(unpackedDir));
    
    if (fs.existsSync(unpackedDir)) {
        console.log('Unpacked目录内容:', fs.readdirSync(unpackedDir));
    }
} 