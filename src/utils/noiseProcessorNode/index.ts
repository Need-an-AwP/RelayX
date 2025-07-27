// @ts-ignore - JavaScript 模块没有类型声明
import noiseProcessorFactory from './noiseProcessorNode.js';

const initNoiseReduceProcessorNode: (context: AudioContext) => Promise<ScriptProcessorNode> = noiseProcessorFactory;

export default initNoiseReduceProcessorNode;