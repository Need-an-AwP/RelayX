# RelayX

RelayX 是一个基于 Electron 的音频中继应用程序，利用 Tailscale 网络和 WebRTC 技术实现实时音频通信和共享。它允许用户在 Tailscale 网络中的设备之间进行高质量的音频传输，包括麦克风输入、应用程序音频捕获和屏幕共享。

## 功能特性

### 🎵 音频处理
- **麦克风输入**: 实时捕获和传输麦克风音频
- **应用程序音频捕获**: 捕获系统上运行的应用程序音频 (CPA - Capture Process Audio)
- **音频编码/解码**: 使用 Opus 编解码器进行高效音频压缩
- **音频频谱可视化**: 实时显示音频频谱和波形
- **噪音抑制**: 内置噪音抑制功能

### 🌐 网络连接
- **Tailscale 集成**: 利用 Tailscale 的安全网络进行设备连接
- **WebRTC 通信**: 低延迟的点对点音频传输
- **自动发现**: 自动发现网络中的在线对等点
- **NAT 穿透**: 支持 NAT 穿透的连接建立

### 💬 实时通信
- **语音聊天**: 多用户语音聊天室
- **状态同步**: 实时同步用户状态（静音、聊天中等）
- **消息传递**: 支持文本消息和控制消息
- **连接管理**: 智能的连接建立和维护

### 🎥 多媒体共享
- **屏幕共享**: 实时屏幕内容共享
- **视频传输**: 支持视频流的传输
- **自适应码率**: 根据网络条件自动调整传输码率

### 🖥️ 用户界面
- **现代化 UI**: 基于 React 和 Tailwind CSS 的美观界面
- **暗色主题**: 支持暗色主题
- **响应式设计**: 自适应不同屏幕尺寸
- **直观操作**: 简洁易用的用户界面

## 技术栈

### 前端
- **React 19**: 用户界面框架
- **TypeScript**: 类型安全的 JavaScript
- **Vite**: 快速构建工具
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Radix UI**: 无障碍访问的 UI 组件库
- **Zustand**: 轻量级状态管理

### 后端服务
- **Go 1.24**: 高性能后端服务
- **Tailscale SDK**: 网络连接和认证
- **WebRTC**: 实时通信协议
- **Gorilla WebSocket**: WebSocket 通信

### 桌面应用
- **Electron**: 跨平台桌面应用框架
- **Node.js**: JavaScript 运行时

### 音频处理
- **Web Audio API**: 浏览器音频处理
- **MediaStreamTrackProcessor**: 音频流处理
- **AudioEncoder/AudioDecoder**: 音频编解码

## 项目结构

```
RelayX/
├── src/                    # React 前端源码
│   ├── components/         # React 组件
│   ├── stores/            # Zustand 状态管理
│   ├── AudioManager/      # 音频上下文管理
│   ├── MediaTrackManager/ # 媒体轨道管理
│   └── types/             # TypeScript 类型定义
├── twg/                   # Go 后端服务 (Tailscale WebRTC Gateway)
│   ├── main.go           # 主程序入口
│   ├── rtc.go            # WebRTC 连接管理
│   ├── ts.go             # Tailscale 集成
│   └── wsService.go      # WebSocket 服务
├── app/                   # Electron 主进程
│   ├── index.mjs         # 主进程入口
│   ├── ipc/              # IPC 通信处理
│   └── subprocess/       # 子进程管理
├── public/                # 静态资源
├── protogen/             # 协议缓冲区生成文件
└── release/              # 构建输出
```

## 安装和运行

### 环境要求
- Node.js 18+
- Go 1.24+
- Windows/macOS/Linux

### 安装依赖
```bash
# 安装前端依赖
yarn install

# 下载音频捕获工具 (可选)
yarn downloadCPA

# 构建 Go 后端
yarn build:go
```

### 开发模式
```bash
# 启动开发服务器
yarn dev
```

### 生产构建
```bash
# 构建前端
yarn build:fe

# 构建完整应用
yarn build
```

## 配置

### Tailscale 设置
首次运行时，应用程序会显示欢迎界面，要求配置：
- **主机名**: Tailscale 网络中的设备名称
- **认证密钥**: Tailscale 认证密钥

### 环境变量
创建 `.env` 文件配置环境变量：
```
NODE_HOSTNAME=your-hostname
TAILSCALE_AUTH_KEY=your-auth-key
```

## 使用指南

### 基本操作
1. **启动应用**: 运行 RelayX 应用程序
2. **配置 Tailscale**: 首次运行时设置主机名和认证密钥
3. **等待连接**: 等待 Tailscale 连接建立
4. **加入聊天**: 点击用户面板中的聊天按钮

### 音频设置
- **麦克风**: 在用户面板中选择麦克风设备
- **应用程序音频**: 点击音乐图标选择要捕获的应用程序
- **音量控制**: 使用滑块调整主音量和静音状态

### 高级功能
- **屏幕共享**: 在聊天面板中启用屏幕共享
- **状态管理**: 实时显示所有在线用户的状态
- **连接监控**: 查看 WebRTC 连接状态和网络统计

## 架构设计

### 组件架构
- **前端 (React)**: 用户界面和交互逻辑
- **Electron 主进程**: 窗口管理、IPC 通信、子进程控制
- **Go 后端服务**: 网络连接、WebRTC 管理、WebSocket 服务
- **音频处理引擎**: 实时音频捕获、编码和传输

### 数据流
1. **音频输入**: 麦克风/应用程序 → 音频上下文 → 编码器 → WebRTC
2. **网络传输**: WebRTC → Tailscale 网络 → 对等点
3. **音频输出**: WebRTC → 解码器 → 音频上下文 → 扬声器

### 通信协议
- **WebRTC**: 媒体数据传输
- **WebSocket**: 控制消息和状态同步
- **HTTP**: 连接建立和信令
- **UDP**: 对等点发现和广播

## 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 配置的代码风格
- 使用 Prettier 格式化代码

### 调试
- **前端调试**: 使用 Chrome DevTools
- **Electron 调试**: 使用 Electron DevTools
- **Go 调试**: 使用 Delve 调试器

### 测试
```bash
# 运行前端测试
yarn test

# 运行 lint 检查
yarn lint
```

## 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置
1. Fork 本仓库
2. 克隆到本地: `git clone https://github.com/your-username/RelayX.git`
3. 安装依赖: `yarn install`
4. 启动开发: `yarn dev`

### 提交规范
- 使用清晰的提交信息
- 遵循 Conventional Commits 规范
- 为新功能编写测试

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- [Tailscale](https://tailscale.com/) - 提供安全网络连接
- [WebRTC](https://webrtc.org/) - 实时通信技术
- [Electron](https://electronjs.org/) - 桌面应用框架
- [Pion WebRTC](https://github.com/pion/webrtc) - Go WebRTC 实现

## 联系方式

- 项目主页: [GitHub](https://github.com/Need-an-AwP/RelayX)
- 问题反馈: [Issues](https://github.com/Need-an-AwP/RelayX/issues)

---

**注意**: 本项目仍在开发中，某些功能可能不稳定。如遇到问题，请查看 [已知问题](#) 或提交 Issue。