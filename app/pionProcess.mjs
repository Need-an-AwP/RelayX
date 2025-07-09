import { spawn } from 'child_process';


export function startPionProcess(window, envFilePath, pionProcessPath) {
    let askTailscaleStatusIntervalId;
    let pionProcess;
    let TURNinfo;
    const args = [];
    if (envFilePath) {
        args.push(`--env=${envFilePath}`);
    }

    pionProcess = spawn(pionProcessPath, args, { detached: false });

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
                console.log(e)
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

    return {
        askTailscaleStatusIntervalId,
        pionProcess,
        TURNinfo,
    }
}