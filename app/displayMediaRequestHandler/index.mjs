import { desktopCapturer, session, ipcMain } from 'electron';

async function getAvailableSources() {
    const thumbnailSizeNum = 400
    const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: thumbnailSizeNum, height: thumbnailSizeNum },
        fetchWindowIcons: true
    })

    const serializedSources = sources.map(source => ({
        id: source.id,
        name: source.name,
        display_id: source.display_id,
        thumbnail: source.thumbnail.toDataURL(),
        appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }));

    return serializedSources;
}

let screenCaptureId;
function setScreenCaptureId(id) {
    screenCaptureId = id;
}


function setDisplayMediaRequestHandler() {
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        // console.log('setDisplayMediaRequestHandler', request);
        try {
            let captureId = screenCaptureId;

            if (!captureId) {
                throw new Error('electronCaptureId is not set');
            }
            console.log('captureId', captureId);
            desktopCapturer.getSources({
                types: captureId.startsWith('screen') ? ['screen'] : ['window']
            })
                .then((sources) => {
                    const source = sources.find(s => s.id === captureId);
                    callback({ video: source })
                })

        } catch (error) {
            console.error('Error setting display media request handler', error);
        }
        // If true, use the system picker if available.
        // Note: this is currently experimental. If the system picker
        // is available, it will be used and the media request handler
        // will not be invoked.
    }, { useSystemPicker: false })

    // destop capture
    ipcMain.handle('get-screen-sources', async (e, d) => {
        return await getAvailableSources();
    })

    ipcMain.on('set-screen-capture-id', (e, d) => {
        setScreenCaptureId(d);
    })
}


export {
    setScreenCaptureId,
    getAvailableSources,
    setDisplayMediaRequestHandler
}