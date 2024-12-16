const { desktopCapturer, session } = require('electron')

async function getAvailableSources() {
    const thumbnailSizeNum = 600
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

let captureId;
function setCaptureId(id) {
    captureId = id;
}

function setDisplayMediaRequestHandler() {
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        try {
            if (!captureId) {
                throw new Error('Capture ID is not set');
            }
            
            desktopCapturer.getSources({
                types: captureId.startsWith('screen') ? ['screen'] : ['window']
            })
                .then((sources) => {
                    const source = sources.find(s => s.id === captureId);
                    callback({ video: source, audio: 'loopback' })
                })

        } catch (error) {
            console.error('Error setting display media request handler', error);
        }
        // If true, use the system picker if available.
        // Note: this is currently experimental. If the system picker
        // is available, it will be used and the media request handler
        // will not be invoked.
    }, { useSystemPicker: false })
}

module.exports = {
    setCaptureId,
    getAvailableSources,
    setDisplayMediaRequestHandler
}