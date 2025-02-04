# RelayX

基于私有Tailscale网络的去中心化语音聊天应用

## 简介

RelayX 是一个创新的去中心化语音通讯应用程序，它利用 [Tailscale](https://tailscale.com/) 强大的网络功能，提供安全、低延迟的语音通信体验。使用私有的Tailscale网络控制器[Headscale](https://headscale.net/)实现完全可控的服务。RelayX 旨在创建一个无需中心服务器的、用户自主控制的语音交流平台。

本项目使用 Vite React TypeScript 模板创建，前端使用 React 和 TypeScript 构建，后端使用 Electron 和纯 JavaScript。

## 测试视频

[![image](https://github.com/user-attachments/assets/bd007e48-3a0b-47e5-bd08-e87a3989265f)](https://youtu.be/i-BA5WPv-Wg)

> 此视频使用obs录制，分辨率为3840*1080，即两个1080p屏幕横向拼接，左侧为Hyper-V虚拟机及其中运行的客户端，右侧为主机中的客户端

## 特性

- 去中心化网络: 基于Tailscale隧道技术，实现真正的点对点连接，无需中心服务器，保障用户隐私和数据安全
- 内置轻量化Tailscale客户端：使用重新构建的轻量Tailscale客户端，无需依赖额外的Tailscale服务
- 语音输入降噪：使用来自xiph的[rnnoise](https://github.com/xiph/rnnoise/)实现实时的语音输入降噪
- 跨平台支持：目前仅支持Windows
- 频道管理: 允许用户创建和管理频道，方便组织和管理用户群体。
- 用户状态管理: 实时同步用户在线状态和语音频道状态。
- 现代 UI: 使用 [Shadcn/ui](https://ui.shadcn.com/) 组件库和 [Tailwind CSS](https://tailwindcss.com/) 构建美观、响应式的用户界面。
- 屏幕捕获分享：在进行语音通话时，可以捕获屏幕内容并分享给频道中的其他用户
- 音频捕获分享：捕获系统中正在播放音频的进程并附加到语音输出中，由我编写的音频捕获重建插件提供支持[win-process-audio-capture-0.0.4](https://github.com/Need-an-AwP/Capture-Audio-from-Process---javascript-addon)

## 技术栈

- **前端**:
    - [React](https://reactjs.org/)
    - [TypeScript](https://www.typescriptlang.org/)
    - [Vite](https://vitejs.dev/)
    - [Shadcn/ui](https://ui.shadcn.com/)
    - [Tailwind CSS](https://tailwindcss.com/)
    - [Zustand](https://zustand.pm/) (状态管理)
    - [React-resizable-panels](https://github.com/szhsiny/react-resizable-panels) (可调整大小的面板)
    - [React-rnd](https://github.com/bokuweb/react-rnd) (可拖拽和缩放的组件)
    - [Framer Motion](https://www.framer.com/motion/) (动画库)
    - [Lucide React](https://lucide.dev/icons) (图标库)
    - [Tailwind-merge](https://github.com/dcastil/tailwind-merge) (CSS 类名管理)
- **后端**:
    - [Electron](https://www.electronjs.org/)
    - [Node.js](https://nodejs.org/) (CommonJS)
    - [Tailscale Go SDK](https://pkg.go.dev/tailscale.com/tsnet) (嵌入式 Tailscale 客户端)
    - [Koffi](https://www.npmjs.com/package/koffi) (Node.js FFI 库，用于加载 DLL)
    - [win-process-audio-capture](https://github.com/Need-an-AwP/Capture-Audio-from-Process---javascript-addon) (Windows 进程音频捕获)
- **其他**:
    - [electron-builder](https://www.electron.build/) (Electron 应用打包)
    - [concurrently](https://www.npmjs.com/package/concurrently) (并发执行命令)
    - [cross-env](https://www.npmjs.com/package/cross-env) (跨平台环境变量设置)
    - [Chokidar](https://github.com/paulmillr/chokidar) (文件监听)
    - [dotenv](https://www.npmjs.com/package/dotenv) (环境变量管理)


## 架构概览

RelayX 是一个典型的electron应用，其架构主要分为前端 (React) 和后端 (Electron/Node.js) 两部分，并通过预加载脚本 (`preload.js`) 进行桥接。

- **前端 (React)**:  负责用户界面渲染和用户交互逻辑。使用 Zustand 进行全局状态管理，包括频道信息、用户信息、当前用户状态、数据库配置等。组件库使用了 Shadcn/ui，并使用 Tailwind CSS 进行样式定制。
- **后端 (Electron/Node.js)**:  负责系统底层操作、Tailscale 客户端集成、音视频处理、进程间通信 (IPC) 等。使用纯 JavaScript 和 CommonJS 模块，方便 Electron 环境集成。
- **预加载脚本 (preload.js)**:  在渲染进程加载前执行，用于安全地暴露 Node.js API 给渲染进程，实现前端与后端的通信桥梁。
- **Tailscale 集成**:  通过 Go 语言编写的 Tailscale 嵌入式客户端 ( `tailscale-embed` )，并编译为 DLL (Windows)动态库，由 Node.js 通过 Koffi FFI 库加载和调用。该嵌入式Tailscale客户端通过在本地指定端口上提供一个代理转发服务，实现将来自前端的WebRTC请求转发到Tailscale网络中。
- **音频处理**:  使用 Web Audio API 进行音频流处理，包括噪音消除、增益控制、音频分析等。音频节点连接状态如下图所示
  <details open>
  <summary>音频节点连接示意图</summary>
  <div class="mermaid">
  graph TB
  
      A["sourceNode<br/><i>MediaStreamSource</i>"] --> B["gainNode<br/><i>GainNode</i>"]
      B --> C{isNoiseReductionEnabled}
      C -->|true| D["processorNode<br/><i>NoiseProcessor</i>"]
      D --> E["mergerNode<br/><i>ChannelMerger</i>"]
      C -->|false| E
      
      subgraph Addon Audio Processing
          F["handleAddonDataNode<br/><i>AudioWorkletNode</i>"] --> G["addonGainNode<br/><i>GainNode</i>"]
          G --> H["addonDestinationNode<br/><i>MediaStreamDestination</i>"]
          H --> I["localAddonStream<br/><i>MediaStream</i>"]
      end
      
      G --> E
      E --> J["destinationNode<br/><i>MediaStreamDestination</i>"]
      E --> K["analyser<br/><i>AnalyserNode</i>"]
      
      %% Final Outputs
      J --> L["localFinalStream<br/><i>MediaStream</i>"]
      
      %% Input Source
      M["localOriginalStream<br/><i>MediaStream</i>"] --> A
      
      %% Style
      classDef default fill:#f9f,stroke:#333,stroke-width:2px;
      classDef stream fill:#bbf,stroke:#333,stroke-width:2px;
      class I,L,M stream;
  </div>
  <script>mermaid.initialize({startOnLoad:true});</script>
  </details>

- **状态管理 （Zustand）**：RelayX 的核心语音及连接管理功能都使用Zustand构建
  <details open>
  <summary>Zustand状态管理示意图</summary>
  <div class="mermaid">
  graph LR

      subgraph stores
          subgraph internals
              subgraph audio
                  useAudioDeviceStore["useAudioDeviceStore<br><i>src/stores/internals/audio/audioDeviceStore.ts</i>"]
                  useAudioProcessing["useAudioProcessing<br><i>src/stores/internals/audio/audioProcessingStore.ts</i>"]
              end
              useBlankStreams["useBlankStreams<br><i>src/stores/internals/blankStreamsStore.ts</i>"]
              useMediaStream["useMediaStream<br><i>src/stores/internals/mediaStreamStore.ts</i>"]
              useRTC["useRTC<br><i>src/stores/internals/rtcStore.ts</i>"]
              useTailscale["useTailscale<br><i>src/stores/internals/tailscaleStore.ts</i>"]
              useDB["useDB<br><i>src/stores/internals/DBStore.ts</i>"]
              useChannel["useChannel<br><i>src/stores/internals/channelsStore.ts</i>"]
              useRemoteUserStore["useRemoteUserStore<br><i>src/stores/internals/remoteUserStore.ts</i>"]
              useCurrentUser["useCurrentUser<br><i>src/stores/internals/currentUserStore.ts</i>"]
              useScreenShare["useScreenShare<br><i>src/stores/internals/screenShareStore.ts</i>"]
              useCurrentChannel["useCurrentChannel<br><i>src/stores/internals/currentChannelStore.ts</i>"]
          end
          useMirror["useMirror<br><i>src/stores/mirrorStates.ts</i>"]
          usePopover["usePopover<br><i>src/stores/popoverStore.ts</i>"]
      end
      subgraph types
          subgraph internals_types
              subgraph audio_types
                  AudioDeviceState["AudioDeviceState<br><i>src/types/internals/audio/audioDeviceTypes.ts</i>"]
                  AudioProcessingState["AudioProcessingState<br><i>src/types/internals/audio/audioProcessingTypes.ts</i>"]
              end
              BlankStreamsStore["BlankStreamsStore<br><i>src/types/internals/blankStreamsStoreTypes.ts</i>"]
              MediaStreamStore["MediaStreamStore<br><i>src/types/internals/mediaStreamStoreTypes.ts</i>"]
              RTCStore["RTCStore<br><i>src/types/internals/rtcTypes.ts</i>"]
              TailscaleStore["TailscaleStore<br><i>src/types/internals/tailscaleStoreTypes.ts</i>"]
              DBStore["DBStore<br><i>src/types/internals/DBStoreTypes.ts</i>"]
              ChannelStore["ChannelStore<br><i>src/types/internals/channelsStoreTypes.ts</i>"]
              RemoteUserState["RemoteUserState<br><i>src/types/internals/remoteUserStoreTypes.ts</i>"]
              CurrentUserStore["CurrentUserStore<br><i>src/types/internals/currentUserStoreTypes.ts</i>"]
              ScreenShareStore_type["ScreenShareStore<br><i>src/types/internals/screenShareStore.ts</i>"]
              CurrentChannelStore_type["CurrentChannelStore<br><i>src/types/internals/currentChannelStoreTypes.ts</i>"]
          end
          MirrorState["MirrorState<br><i>src/stores/mirrorStates.ts</i>"]
          PopoverState["PopoverState<br><i>src/stores/popoverStore.ts</i>"]
      end

      useAudioDeviceStore --> AudioDeviceState
      useAudioProcessing --> AudioProcessingState
      useBlankStreams --> BlankStreamsStore
      useMediaStream --> MediaStreamStore
      useRTC --> RTCStore
      useTailscale --> TailscaleStore
      useDB --> DBStore
      useChannel --> ChannelStore
      useRemoteUserStore --> RemoteUserState
      useCurrentUser --> CurrentUserStore
      useScreenShare --> ScreenShareStore_type
      useCurrentChannel --> CurrentChannelStore_type
      useMirror --> MirrorState
      usePopover --> PopoverState

      useCurrentChannel --> useCurrentUser
      useCurrentChannel --> useChannel
      useAudioDeviceStore --> useAudioProcessing

      style stores fill:#f9f,stroke:#333,stroke-width:2px
      style types fill:#ccf,stroke:#333,stroke-width:2px
      classDef storeNode fill:#f9f,stroke:#333,stroke-width:2px;
      classDef typeNode fill:#ccf,stroke:#333,stroke-width:2px;
      class use*,useMirror,usePopover storeNode
      class Audio*,Blank*,Media*,RTC*,Tailscale*,DB*,Channel*,Remote*,Current*,MirrorState,PopoverState typeNode
      class ScreenShareStore_type typeNode
      class CurrentChannelStore_type typeNode
  </div>
  <script>mermaid.initialize({startOnLoad:true});</script>
  </details>

  > 此mermaid图由ai生成，请以实际代码为准

## 开发准备

### 环境要求
- [Node.js](https://nodejs.org/) >= 20.0.0 (electron-builder 需要 Node.js 20+)
- [Yarn](https://yarnpkg.com/) (推荐包管理器)
- [Go](https://go.dev/) (用于编译 Tailscale 嵌入式客户端)
- Windows 环境开发 (当前文件同步脚本和部分功能仅在Windows上测试)
- Hyper-V Windows虚拟机(可选，用于运行多个客户端)

### 使用虚拟机运行多个客户端(可选)
- 启用Windows的Hyper-V功能
- 在虚拟机中安装Windows(不推荐Windows 11)
- 安装开发环境及配置工具
#### 项目文件同步
参考项目复制工具[files-sync](https://github.com/Need-an-AwP/files-sync)
此项目的`tests`中包含一个文件同步工具[tests/files-sync](./tests/files-sync/README.md)，其核心代码与上述独立repo有一些出入，但由于Windows的文件共享功能时好时坏，所以推荐使用上述[files-sync](https://github.com/Need-an-AwP/files-sync)将项目复制到Hyper-V中

## 开发运行
1. **克隆代码仓库**
   ```bash
   git clone https://github.com/Need-an-AwP/RelayX.git
   cd RelayX
   ```
2. **安装依赖**
   ```bash
   yarn install
   cd tailscale-embed
   go mod tidy
   ```
   > `go mod tidy` 为可选，此项目仓库中已包含预编译的dll文件，如不需重新编译可略过
3. **配置环境变量**
   在项目根目录下创建 `.env` 文件，并配置环境变量如[.env.sample](./.env.sample)所示
   - `CONTROL_URL` 为Headscale控制器地址
   - `SERVER_URL` 为RelayX频道管理服务端地址
   - `NODE_AUTH_KEY` 为Tailscale认证密钥
   - `HEADSCALE_AUTH_KEY` 为Headscale认证密钥
   - `FULLCOPY` 为是否启用全量文件同步
   - `BASE_DESTINATION` 为文件同步的目标路径
    > `NODE_AUTH_KEY`, `FULLCOPY`, `BASE_DESTINATION`, `SERVER_URL` 均为可选配置
4. **开发模式启动项目**
   ```bash
   yarn dev
   ```
   > RNN 降噪模型会在开发启动时加载，其文件较大，会占用约 30s 的 Vite 准备时间。在打包完成后的启动中不会出现这个问题。未来会使用 wasm 版本的降噪模型替换现有的纯 js 版本模型。
5. **重新编译Tailscale嵌入客户端(可选)**
   ```bash
   yarn dev:build
   ```
   > 在运行此命令前请确保已安装Go环境，并已运行`go mod tidy`

## 打包
```bash
yarn build:fe
yarn build:win
```

## 未来计划
- 使用 WASM 版本的降噪模型替换现有的纯 JavaScript 版本，提升性能并减少加载时间。
- 完善预设频道用户与从频道服务获取频道用户的连接处理逻辑。
- 增加更多平台支持，例如 macOS 和 Linux 平台的完整支持。
- 添加文件传输功能
- 添加用户文字聊天
- 添加文件传输功能
- 增加用户状态标识
- 完善单元测试和集成测试，提升代码质量和稳定性。

