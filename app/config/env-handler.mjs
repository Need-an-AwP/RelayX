import { envFilePath as argsEnvFilePath } from '../utils/args.mjs';
import { __dirname, exeDirPath } from '../utils/app-dir-name.mjs';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { parse, stringify } from 'envfile';

var currentEnv = {
    NODE_HOSTNAME: null,
    TAILSCALE_AUTH_KEY: null,
}


const keepEnvVariables = (envPath) => {
    const content = readFileSync(envPath, 'utf8');
    const parsed = parse(content);
    currentEnv.NODE_HOSTNAME = parsed.NODE_HOSTNAME || null;
    currentEnv.TAILSCALE_AUTH_KEY = parsed.TAILSCALE_AUTH_KEY || null;
}

const validateEnvContent = (filePath) => {
    try {
        const content = readFileSync(filePath, 'utf8');
        const parsed = parse(content);
        const hasNodeHostname = parsed.NODE_HOSTNAME && parsed.NODE_HOSTNAME.trim() !== '';
        const hasTailscaleAuthKey = parsed.TAILSCALE_AUTH_KEY && parsed.TAILSCALE_AUTH_KEY.trim() !== '';

        if (!hasNodeHostname || !hasTailscaleAuthKey) {
            console.log(chalk.red(`env file missing required variables: ${!hasNodeHostname ? 'NODE_HOSTNAME ' : ''}${!hasTailscaleAuthKey ? 'TAILSCALE_AUTH_KEY' : ''}`));
            return false;
        }
        return true;
    } catch (error) {
        console.log(chalk.red(`failed to read env file: ${error.message}`));
        return false;
    }
};

export const resolveEnvFilePath = () => {
    if (argsEnvFilePath) {
        if (existsSync(argsEnvFilePath)) {
            global.envFilePath = argsEnvFilePath; // 即使无效也设置路径，以便后续写入
            if (validateEnvContent(argsEnvFilePath)) {
                keepEnvVariables(argsEnvFilePath);
                console.log(chalk.blue(`using env file from flag: ${argsEnvFilePath}`));
                return argsEnvFilePath;
            } else {
                console.log(chalk.red(`env from flag is invalid: ${argsEnvFilePath}`));
                return null;
            }
        } else {
            console.log(chalk.red(`env from flag not exists: ${argsEnvFilePath}`));
        }
    }

    const probEnvFilePath = join(process.env.DEV ? __dirname : exeDirPath, '.env');// in dev, the path is app/, in portable, the path is the exePath
    if (existsSync(probEnvFilePath)) {
        global.envFilePath = probEnvFilePath; // 即使无效也设置路径，以便后续写入
        if (validateEnvContent(probEnvFilePath)) {
            keepEnvVariables(probEnvFilePath);
            console.log(chalk.blue(`using .env file: ${probEnvFilePath}`));
            return probEnvFilePath;
        } else {
            console.log(chalk.red(`default env file is invalid: ${probEnvFilePath}`));
            return null;
        }
    }

    console.log(chalk.yellow('no env file found, creating empty .env file'));
    // create empty env file
    try {
        writeFileSync(probEnvFilePath, '# Environment Configuration\n# NODE_HOSTNAME=your_hostname\n# TAILSCALE_AUTH_KEY=your_auth_key', 'utf8');
        global.envFilePath = probEnvFilePath;
        return null;
    } catch (error) {
        console.log(chalk.red(`failed to create .env file: ${error.message}`));
        return null;
    }
}


export const getEnvConfig = () => {
    return currentEnv;
};


export const setEnvConfig = (envObject) => {
    if (typeof (envObject) !== 'object') {
        return;
    }

    if (global.envFilePath) {
        console.log('setEnvConfig called with:', envObject);
        console.log('writing env to:', global.envFilePath);
        const content = stringify(envObject);
        writeFileSync(global.envFilePath, content, 'utf8');
        // 更新currentEnv
        currentEnv.NODE_HOSTNAME = envObject.NODE_HOSTNAME || null;
        currentEnv.TAILSCALE_AUTH_KEY = envObject.TAILSCALE_AUTH_KEY || null;
    }
};