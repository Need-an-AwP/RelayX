import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { exeDirPath } from './app-dir-name.mjs';

// 创建日志文件路径
const logFilePath = join(process.env.DEV ? process.cwd() : exeDirPath, 'app.log');

// 保存原始的 console 方法
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
};

// 写入日志文件的函数
const writeToLogFile = (level, args) => {
    if (!process.env.DEV) {
        const timestamp = new Date().toISOString();
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
        
        try {
            appendFileSync(logFilePath, logMessage, 'utf8');
        } catch (error) {
            originalConsole.error('Failed to write to log file:', error);
        }
    }
};

// 初始化日志系统
export const initLogger = () => {
    try {
        // 清空或创建日志文件
        writeFileSync(logFilePath, `Application started at ${new Date().toISOString()}\n`, 'utf8');
        
        // 重写 console 方法
        console.log = (...args) => {
            writeToLogFile('log', args);
            originalConsole.log(...args);
        };

        console.error = (...args) => {
            writeToLogFile('error', args);
            originalConsole.error(...args);
        };

        console.warn = (...args) => {
            writeToLogFile('warn', args);
            originalConsole.warn(...args);
        };

        console.info = (...args) => {
            writeToLogFile('info', args);
            originalConsole.info(...args);
        };

        console.debug = (...args) => {
            writeToLogFile('debug', args);
            originalConsole.debug(...args);
        };

        console.log('Logger initialized successfully');
        
        // 捕获未处理的异常和 Promise 拒绝
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error.message);
            console.error('Stack:', error.stack);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise);
            console.error('Reason:', reason);
        });

    } catch (error) {
        originalConsole.error('Failed to initialize logger:', error);
    }
};

// 获取日志文件路径（用于调试）
export const getLogFilePath = () => logFilePath;

// 恢复原始 console（如果需要）
export const restoreConsole = () => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
};