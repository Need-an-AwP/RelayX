import { envFilePath as argsEnvFilePath } from '../utils/args.mjs';
import { __dirname, exePath } from '../utils/app-dir-name.mjs';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';


const validateEnvContent = (filePath) => {
    try {
        const content = readFileSync(filePath, 'utf8');
        // 确保环境变量行不是注释且有非空值
        const hasNodeHostname = /^[^#\n]*NODE_HOSTNAME\s*=\s*\S+/m.test(content);
        const hasTailscaleAuthKey = /^[^#\n]*TAILSCALE_AUTH_KEY\s*=\s*\S+/m.test(content);
        
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

export const resolveEnvFilePath = (window) => {
    if (argsEnvFilePath) {
        if (existsSync(argsEnvFilePath)) {
            if (validateEnvContent(argsEnvFilePath)) {
                global.envFilePath = argsEnvFilePath;
                return argsEnvFilePath;
            } else {
                console.log(chalk.red(`env from flag is invalid: ${argsEnvFilePath}`));
                return null;
            }
        } else {
            window.webContents.send('no-env-file', { created: true, path: probEnvFilePath });
            console.log(chalk.red(`env from flag not exists: ${argsEnvFilePath}`));
        }
    }

    const probEnvFilePath = join(process.env.DEV ? __dirname : exePath, '.env');// in dev, the path is app/, in portable, the path is the exePath
    if (existsSync(probEnvFilePath)) {
        if (validateEnvContent(probEnvFilePath)) {
            console.log(chalk.blue(`using .env file: ${probEnvFilePath}`));
            global.envFilePath = probEnvFilePath;
            return probEnvFilePath;
        } else {
            console.log(chalk.red(`default env file is invalid: ${probEnvFilePath}`));
            window.webContents.send('no-env-file', { created: true, path: probEnvFilePath });
            return null;
        }
    }

    console.log(chalk.yellow('no env file found, creating empty .env file'));
    // create empty env file
    try {
        writeFileSync(probEnvFilePath, '# Environment Configuration\n# NODE_HOSTNAME=your_hostname\n# TAILSCALE_AUTH_KEY=your_auth_key', 'utf8');
        window.webContents.send('no-env-file', { created: true, path: probEnvFilePath });
        global.envFilePath = probEnvFilePath;
        return null;
    } catch (error) {
        console.log(chalk.red(`failed to create .env file: ${error.message}`));
        window.webContents.send('no-env-file', { created: false, error: error.message });
        return null;
    }
}


export const getEnvConfig = () => {
    if (global.envFilePath) {
        return readFileSync(global.envFilePath, 'utf8');
    }
    return null;
};


export const setEnvConfig = ( content) => {
    if (global.envFilePath) {
        writeFileSync(global.envFilePath, content, 'utf8');
    }
};