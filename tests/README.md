
## prevent powershell display error(optional)
enable global UTF-8 support to avoid chinese display as error code in power shell
https://stackoverflow.com/a/57134096/20001298
if the language of annotation in ps script is not English, then unicode setting must be enabled

## hyper-V Windows 10 configuration

### turn on the share property of the target folder

### to run command in remote ps
install nodejs>=20 and yarn

```powershell
Enable-PSRemoting -force
Enable-WSManCredSSP -Role server
```

LocalMachine scope will permanently change the policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```
check if the execution policy is set to RemoteSigned
```powershell
Get-ExecutionPolicy
```
then it is able to run powershell scripts, like `yarn -v`

## file watcher
it get params from .env file and pass them to ps script

the full copy mode means that it will copy everything from this project to the destination

enable full copy mode then you can run dev in hyper-V without setting other things

full copy mode is enabled by default

In chokidar 4.x, glob is removed

## watch ignore list
- node_modules
- dist
- release
- .git
- tests/files-sync
- .env
  
## copy ignore list
(in full copy mode nothing is ignored)
- node_modules
- release
- dist
- .git

## run
**please check if powershell can cd to the hyper-V path before run this file sync service**

```bash
yarn dev:sync
```