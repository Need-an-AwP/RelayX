# project files sync to hyperV dev environment
**run this script if you understand what it does**

## prevent powershell display error(optional)
enable global UTF-8 support to avoid chinese display as error code in power shell
https://stackoverflow.com/a/57134096/20001298
if the language of annotation in ps script is not English, then unicode setting must be enabled

## hyper-V Windows configuration
### Windows version requirement
till 2025 Jan, windows 11 still has serious SMB problem, even if the host and hyperV are both windows 11, the file share function stll needs the SMB 1.0 enabled
my testing environment is windows 10 for both host and hyperV, no need extra configuration

### installation list
- nodejs>=20
- vscode(optional)
- git

### enable yarn
```bash
corepack enable
```

### **turn on the share property of the target folder**
turn on the share property of the target folder, the target folder could be a disk root or a folder
like `\\HYPERV\c` or `\\HYPERV\Desktop`
> in windows, a remote location's host name must be all in uppercase
> using `whoami` will get a all lowercase name, and using `systeminfo` can get an all uppercase name
> the best way to get the shared target path is copy the "Netwok Path" from "Properties" of the target folder when you enable its share property

if everything is ok, you can see the shared target in your host machine's network location
if not check these options:
- **Network discovery** is enabled
- File and printer sharing is enabled
- Network profile type is set to **private**
- Windows Firewall is disabled

### ~~to run command in remote ps~~
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
even though the watcher.js has error handling for invalid path, it is still recommended to check the path before run this file sync service

```bash
yarn dev:sync
```

## final backup solution
use another independent node.js project in hyperV to watch the target folder in host machine, and copy it