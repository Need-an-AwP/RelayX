import chalk from 'chalk';
import { Command } from 'commander';
const program = new Command();

program
    .option('-p, --port <number>', 'Specify the development server port') // 移除 parseInt，让 Commander.js 自动处理
    .option('-e, --env <path>', 'Specify the environment file path')
    .option('-c, --config <name>', 'Specify the configuration name');

// use complete process.argv instead of slice it
program.parse(process.argv);

const options = program.opts();
let devServerPort = options.port ? parseInt(options.port, 10) : 5173;
const envFilePath = options.env;
let configName = options.config || "user-config";//no need json suffix

if(devServerPort) {
    console.log(chalk.green('devServerPort:'), devServerPort);
}
if(envFilePath) {
    console.log(chalk.green('envFilePath:'), envFilePath);
}
if(configName) {
    console.log(chalk.green('configName:'), configName);
}

export { devServerPort, envFilePath, configName };






