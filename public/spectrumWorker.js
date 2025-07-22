const DISPLAY_BINS_PERCENTAGE = 0.8; // percentage of bins to display
const SMOOTHING_CONSTANT = 0.6;      // Higher value = more smoothing (slower response). 0 means no smoothing.

const canvases = {};

function draw(instance) {
    if (!instance || !instance.ctx || !instance.canvas) return;

    const { ctx, canvas, config, dataArray, smoothedData } = instance;
    const { displayStyle, verticalAlignment } = config;

    if (!dataArray) return;

    const bufferLength = dataArray.length;
    const binsToDisplay = Math.ceil(bufferLength * DISPLAY_BINS_PERCENTAGE);

    if (!smoothedData || smoothedData.length !== binsToDisplay) {
        instance.smoothedData = new Float32Array(binsToDisplay);
    }

    if (displayStyle === 'line') {
        for (let i = 0; i < binsToDisplay; i++) {
            instance.smoothedData[i] = (dataArray[i] * (1 - SMOOTHING_CONSTANT)) + (instance.smoothedData[i] * SMOOTHING_CONSTANT);
        }
    }
    const currentSmoothedData = instance.smoothedData;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barWidth = displayStyle === 'line' && binsToDisplay > 1
        ? width / (binsToDisplay - 1)
        : width / binsToDisplay;
    let barHeight;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, '#a855f7');
    ctx.fillStyle = gradient;

    if (displayStyle === 'line') {
        ctx.beginPath();
        let x = 0;
        if (verticalAlignment === 'center') {
            let barHeight = currentSmoothedData[0] / 255 * height;
            let y = (height - barHeight) / 2;
            ctx.moveTo(x, y);

            for (let i = 1; i < binsToDisplay; i++) {
                x += barWidth;
                barHeight = currentSmoothedData[i] / 255 * height;
                y = (height - barHeight) / 2;
                ctx.lineTo(x, y);
            }

            for (let i = binsToDisplay - 1; i >= 0; i--) {
                barHeight = currentSmoothedData[i] / 255 * height;
                y = (height + barHeight) / 2;
                ctx.lineTo(x, y);
                x -= barWidth;
            }
        } else {
            ctx.moveTo(0, height);
            for (let i = 0; i < binsToDisplay; i++) {
                x = i * barWidth;
                barHeight = currentSmoothedData[i] / 255 * height;
                let y = height - barHeight;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
        }
        ctx.closePath();
        ctx.fill();
    } else { // 'bar' style
        let x = 0;
        for (let i = 0; i < binsToDisplay; i++) {
            const barHeight = dataArray[i] / 255 * height;
            if (verticalAlignment === 'center') {
                ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
            } else {
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            }
            x += barWidth;
        }
    }
}

self.onmessage = (e) => {
    const { type, payload } = e.data;
    switch (type) {
        case 'add-canvas':
            try {
                canvases[payload.id] = {
                    canvas: payload.canvas,
                    ctx: payload.canvas.getContext('2d'),
                    config: payload.config,
                    dataArray: null,
                    smoothedData: null
                };
                // console.log(`[spectrumWorker #${workerId}] canvases AFTER add:`, Object.keys(canvases));
            } catch (error) {
                console.error(`[spectrumWorker #${workerId}] FAILED to add canvas ${payload.id}:`, error);
            }
            break;
        case 'remove-canvas':
            delete canvases[payload.id];
            // console.log(`[spectrumWorker #${workerId}] canvases AFTER remove:`, Object.keys(canvases));
            break;
        case 'render':
            // console.log(`[spectrumWorker #${workerId}] render received for:`, payload.id, 'Existing canvases:', Object.keys(canvases));
            if (canvases[payload.id]) {
                canvases[payload.id].dataArray = payload.dataArray;
                draw(canvases[payload.id]);
            } else {
                console.warn(`[spectrumWorker #${workerId}] try render`, payload.id, 'but not found');
            }
            break;
        case 'update-config':
            console.log(`[spectrumWorker #${workerId}] update-config received for:`, payload.id, 'Existing canvases:', Object.keys(canvases));
            if (canvases[payload.id]) {
                canvases[payload.id].config = { ...canvases[payload.id].config, ...payload.config };
            }
            break;
        default:
            console.warn('Unknown message type in spectrum worker:', type);
    }
};

self.postMessage({ type: 'ready' });
// console.log(`[spectrumWorker #${workerId}] ready`);