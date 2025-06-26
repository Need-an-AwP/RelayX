// 声明工厂函数的类型
declare function initNoiseReduceProcessorNode(context: AudioContext): Promise<ScriptProcessorNode>;

// 导入 JavaScript 模块
import noiseProcessorFactory from './noiseProcessorNode.js';

// 导出带类型的工厂函数
export default noiseProcessorFactory as typeof initNoiseReduceProcessorNode;