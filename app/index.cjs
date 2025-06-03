const { app, shell, BrowserWindow, ipcMain, desktopCapturer, session } = require('electron')
const path = require('path')
const { spawn } = require('child_process');

const GOEXE = path.join(__dirname, 'turn-on-tailscale.exe');
let pionProcess; // Will be initialized in startBackendProcess
let askTailscaleStatusIntervalId; // For a more descriptive name
let TURNinfo;
let mainWindow; // Moved declaration here
let webrtcInternalsWindow; // Declare new window variable

// Function to start and manage the Go backend process
function startBackendProcess(window, envFilePath) {
    const args = [];
    if (envFilePath) {
        args.push(`--env=${envFilePath}`);
    }

    pionProcess = spawn(GOEXE, args, { detached: false });

    pionProcess.stdout.on('data', (data) => {
        const messages = data.toString().trim().split('\n');
        messages.forEach(msgStr => {
            try {
                const message = JSON.parse(msgStr);
                switch (message.type) {
                    case "TURNinfo":
                        window.webContents.send('TURNinfo', message)
                        TURNinfo = message;
                        break;
                    case "onlinePeers":
                        window.webContents.send('onlinePeers', message)
                        break;
                    case "tailscaleInfo":
                        window.webContents.send('tailscaleInfo', message)
                        break;
                    case "accessibility":
                        window.webContents.send('accessibility', message)
                        break;
                    case "http/offer_ice":
                        window.webContents.send('http/offer_ice', message)
                        break;
                    case "http/answer_ice":
                        window.webContents.send('http/answer_ice', message)
                        break;
                }
            } catch (e) { 
                // only print content which cannot be parsed as json
                // console.log(e)
                console.log(`Backend STDOUT: ${msgStr}`);
            }
        });
    });

    pionProcess.stderr.on('data', (data) => {
        console.error(`Backend STDERR: ${data.toString()}`);
    });

    pionProcess.on('error', (err) => {
        console.error('Failed to start Go backend process. Error:', err);
    });

    pionProcess.on('exit', (code, signal) => {
        console.log(`Go backend process exited with code ${code} and signal ${signal}`);
        if (askTailscaleStatusIntervalId) {
            clearInterval(askTailscaleStatusIntervalId);
        }
    });

    // Start polling client status
    if (pionProcess && pionProcess.stdin) {
         askTailscaleStatusIntervalId = setInterval(() => {
            if (pionProcess && pionProcess.stdin && !pionProcess.killed) {
                try {
                    pionProcess.stdin.write("client-status\n");
                } catch (error) {
                    console.error("Error writing to pionProcess stdin:", error);
                    clearInterval(askTailscaleStatusIntervalId);
                }
            } else {
                 clearInterval(askTailscaleStatusIntervalId);
            }
        }, 5000);
    }
}

function handleBasicWindowAction(window){
    ipcMain.on('minimize-window', () => {
        window.minimize();
    });
    ipcMain.on('maximize-window', () => {
        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }
    });
    ipcMain.on('close-window', () => {
        window.close();
    });
}

const isDev = process.env.DEV != undefined;
// let mainWindow; // Moved to top

function createWebRTCInternalsWindow() {
    if (webrtcInternalsWindow) { // Prevent opening multiple instances
        webrtcInternalsWindow.focus();
        return;
    }

    webrtcInternalsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'WebRTC Internals',
        autoHideMenuBar: true,
        webPreferences: {
            // Default webPreferences are usually fine for chrome:// URLs
        }
    });

    webrtcInternalsWindow.loadURL('chrome://webrtc-internals');

    webrtcInternalsWindow.on('closed', () => {
        webrtcInternalsWindow = null;
    });
}

function createWindow() {
    // Parse command line arguments for port and hostname
    let devServerPort = 5173; // Default port
    let envFilePath = null;

    const args = process.argv.slice(isDev ? 2 : 1); // electron_path, app_path, then args OR app_path, then args
    args.forEach(arg => {
        if (arg.startsWith('--port=')) {
            const portNum = parseInt(arg.split('=')[1]);
            if (!isNaN(portNum)) {
                devServerPort = portNum;
            }
        } else if (arg.startsWith('--env=')) {
            envFilePath = arg.split('=')[1];
        }
    });

    mainWindow = new BrowserWindow({
        width: 500,
        height: 800 + 32,
        autoHideMenuBar: true,
        frame: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            spellcheck: false,
            nodeIntegration: true, 
            contextIsolation: true,
        }
    });

    startBackendProcess(mainWindow, envFilePath);

    ipcMain.on('offer', (event, message) => {
        if (pionProcess) {
            console.log('forwarding offer to go subprocess')
            pionProcess.stdin.write(message + '\n');
        }
    });

    ipcMain.on('answer', (event, message) => {
        if (pionProcess) {
            console.log('forwarding answer to go subprocess')
            pionProcess.stdin.write(message + '\n');
        }
    });

    // async request TURN info
    ipcMain.handle('request-TURN-info', async () => {
        return TURNinfo;
    })

    handleBasicWindowAction(mainWindow);

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        createWebRTCInternalsWindow(); // Create the new window when main window is ready
    });

    mainWindow.on('closed', () => {
        if (webrtcInternalsWindow && !webrtcInternalsWindow.isDestroyed()) {
            webrtcInternalsWindow.close();
        }
        mainWindow = null; // Dereference the main window object
        if (process.platform !== 'darwin') {
            // app.quit(); // This is handled by window-all-closed
        }
    });

    mainWindow.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
        event.preventDefault();
        callback(true);
    });

    if (isDev) {
        mainWindow.loadURL(`http://localhost:${devServerPort}`);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (pionProcess && !pionProcess.killed) {
        console.log("Attempting to kill Go backend process...");
        pionProcess.kill();
    }
    if (askTailscaleStatusIntervalId) {
        clearInterval(askTailscaleStatusIntervalId);
    }
});
