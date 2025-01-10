import NoiseModule from './noise'


const initNoiseReduceProcessorNode = (ctx) => {
    let Module;
    let frameBuffer = [];
    var inputBuffer = [];
    var outputBuffer = [];
    var bufferSize = 1024;
    function initializeNoiseSuppressionModule() {
        if (Module) {
            return;
        }
        Module = {
            noExitRuntime: true,
            noInitialRun: true,
            preInit: [],
            preRun: [],
            postRun: [
                function () {
                    console.log(`Loaded Javascript Module OK`);
                },
            ],
            memoryInitializerPrefixURL: "bin/",
            arguments: ["input.ivf", "output.raw"],
        };
        NoiseModule(Module);
        Module.st = Module._rnnoise_create();
        Module.ptr = Module._malloc(480 * 4);
    }
    function removeNoise(buffer) {
        let ptr = Module.ptr;
        let st = Module.st;
        for (let i = 0; i < 480; i++) {
            Module.HEAPF32[(ptr >> 2) + i] = buffer[i] * 32768;
        }
        Module._rnnoise_process_frame(st, ptr, ptr);
        for (let i = 0; i < 480; i++) {
            buffer[i] = Module.HEAPF32[(ptr >> 2) + i] / 32768;
        }
    }
    const processorNode = ctx.createScriptProcessor(bufferSize, 1, 1);
    initializeNoiseSuppressionModule();
    processorNode.onaudioprocess = (e) => {
        var input = e.inputBuffer.getChannelData(0);
        var output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            inputBuffer.push(input[i]);
        }
        while (inputBuffer.length >= 480) {
            for (let i = 0; i < 480; i++) {
                frameBuffer[i] = inputBuffer.shift();
            }
            // Process Frame
            removeNoise(frameBuffer);
            for (let i = 0; i < 480; i++) {
                outputBuffer.push(frameBuffer[i]);
            }
        }
        // Not enough data, exit early, etherwise the AnalyserNode returns NaNs.
        if (outputBuffer.length < bufferSize) {
            return;
        }
        // Flush output buffer.
        for (let i = 0; i < bufferSize; i++) {
            output[i] = outputBuffer.shift();
        }
    };

    return processorNode;
}



export default initNoiseReduceProcessorNode