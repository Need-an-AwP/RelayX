# RelayX

A decentralized voice chat application based on a private Tailscale network.

> [简体中文](./README_zh_CN.md)
> this english version is translated by AI from simplified chinese version

## Introduction

RelayX is an innovative decentralized voice communication application that leverages the powerful network capabilities of [Tailscale](https://tailscale.com/) to provide a secure, low-latency voice communication experience. It utilizes a private Tailscale network controller [Headscale](https://headscale.net/) to achieve fully controllable services. RelayX aims to create a user-controlled voice communication platform without the need for central servers.

This project is created using the Vite React TypeScript template, with the frontend built using React and TypeScript, and the backend using Electron and pure JavaScript.

## Test Video
[![image](https://github.com/user-attachments/assets/bd007e48-3a0b-47e5-bd08-e87a3989265f)](https://youtu.be/i-BA5WPv-Wg)

> This video is recorded using OBS at a resolution of 3840*1080, which is two 1080p screens horizontally stitched together. The left side shows a Hyper-V virtual machine and its running client, while the right side shows the client in the host machine.


## Features

- **Decentralized Network:** Based on Tailscale tunneling technology, it achieves true peer-to-peer connections, eliminating the need for central servers and ensuring user privacy and data security.
- **Built-in Lightweight Tailscale Client:** Uses a rebuilt lightweight Tailscale client, eliminating the dependency on additional Tailscale services.
- **Voice Input Noise Reduction:** Implements real-time voice input noise reduction using [rnnoise](https://github.com/xiph/rnnoise/) from xiph.
- **Cross-Platform Support:** Currently only supports Windows.
- **Channel Management:** Allows users to create and manage channels, facilitating the organization and management of user groups.
- **User Status Management:** Real-time synchronization of user online status and voice channel status.
- **Modern UI:** Built with [Shadcn/ui](https://ui.shadcn.com/) component library and [Tailwind CSS](https://tailwindcss.com/) to create a beautiful and responsive user interface.
- **Screen Capture Sharing:** During voice calls, users can capture screen content and share it with other users in the channel.
- **Audio Capture Sharing:** Captures audio-playing processes in the system and attaches them to the voice output, supported by an audio capture reconstruction plugin I wrote: [win-process-audio-capture-0.0.4](https://github.com/Need-an-AwP/Capture-Audio-from-Process---javascript-addon)

## Technology Stack

- **Frontend**:
    - [React](https://reactjs.org/)
    - [TypeScript](https://www.typescriptlang.org/)
    - [Vite](https://vitejs.dev/)
    - [Shadcn/ui](https://ui.shadcn.com/)
    - [Tailwind CSS](https://tailwindcss.com/)
    - [Zustand](https://zustand.pm/) (State Management)
    - [React-resizable-panels](https://github.com/szhsiny/react-resizable-panels) (Resizable Panels)
    - [React-rnd](https://github.com/bokuweb/react-rnd) (Draggable and Resizable Components)
    - [Framer Motion](https://www.framer.com/motion/) (Animation Library)
    - [Lucide React](https://lucide.dev/icons) (Icon Library)
    - [Tailwind-merge](https://github.com/dcastil/tailwind-merge) (CSS Class Name Management)
- **Backend**:
    - [Electron](https://www.electronjs.org/)
    - [Node.js](https://nodejs.org/) (CommonJS)
    - [Tailscale Go SDK](https://pkg.go.dev/tailscale.com/tsnet) (Embedded Tailscale Client)
    - [Koffi](https://www.npmjs.com/package/koffi) (Node.js FFI Library for loading DLLs)
    - [win-process-audio-capture](https://github.com/Need-an-AwP/Capture-Audio-from-Process---javascript-addon) (Windows Process Audio Capture)
- **Other**:
    - [electron-builder](https://www.electron.build/) (Electron Application Packaging)
    - [concurrently](https://www.npmjs.com/package/concurrently) (Concurrent Execution of Commands)
    - [cross-env](https://www.npmjs.com/package/cross-env) (Cross-Platform Environment Variable Setting)
    - [Chokidar](https://github.com/paulmillr/chokidar) (File Watching)
    - [dotenv](https://www.npmjs.com/package/dotenv) (Environment Variable Management)


## Architecture Overview

RelayX is a typical Electron application, and its architecture is mainly divided into two parts: the frontend (React) and the backend (Electron/Node.js), bridged by a preload script (`preload.js`).

- **Frontend (React)**: Responsible for user interface rendering and user interaction logic. Uses Zustand for global state management, including channel information, user information, current user status, database configuration, etc. The component library used is Shadcn/ui, and Tailwind CSS is used for style customization.
- **Backend (Electron/Node.js)**: Responsible for system-level operations, Tailscale client integration, audio and video processing, inter-process communication (IPC), etc. Uses pure JavaScript and CommonJS modules for easy integration with the Electron environment.
- **Preload Script (preload.js)**: Executed before the rendering process is loaded, used to securely expose Node.js APIs to the rendering process, implementing a communication bridge between the frontend and backend.
- **Tailscale Integration**: Through a Tailscale embedded client (`tailscale-embed`) written in Go and compiled into a DLL (Windows) dynamic library, Node.js loads and calls it through the Koffi FFI library. This embedded Tailscale client provides a proxy forwarding service on a locally specified port, implementing the forwarding of WebRTC requests from the frontend to the Tailscale network.
- **Audio Processing**: Uses the Web Audio API for audio stream processing, including noise reduction, gain control, audio analysis, etc. The audio node connection status is shown in the diagram below:
  <details open>
  <summary>Audio Node Connection Diagram</summary>
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

- **State Management (Zustand)**: RelayX's core voice and connection management functions are built using Zustand.
  <details open>
  <summary>Zustand State Management Diagram</summary>
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

  > This mermaid diagram is generated by AI, please refer to the actual code for accuracy.

## Development Preparation

### Environment Requirements
- [Node.js](https://nodejs.org/) >= 20.0.0 (electron-builder requires Node.js 20+)
- [Yarn](https://yarnpkg.com/) (Recommended package manager)
- [Go](https://go.dev/) (For compiling the Tailscale embedded client)
- Windows development environment (Current file synchronization script and some features are only tested on Windows)
- Hyper-V Windows virtual machine (Optional, for running multiple clients)

### Running Multiple Clients in a Virtual Machine (Optional)
- Enable Windows Hyper-V feature
- Install Windows in the virtual machine (Windows 11 is not recommended)
- Install development environment and configuration tools
#### Project File Synchronization
Refer to the project copy tool [files-sync](https://github.com/Need-an-AwP/files-sync)
The `tests` directory of this project contains a file synchronization tool [tests/files-sync](./tests/files-sync/README.md). The core code of this tool differs slightly from the standalone repo mentioned above, but due to the intermittent nature of Windows file sharing, it is recommended to use the aforementioned [files-sync](https://github.com/Need-an-AwP/files-sync) to copy the project to Hyper-V.

## Development Run
1. **Clone the code repository**
   ```bash
   git clone https://github.com/Need-an-AwP/RelayX.git
   cd RelayX
   ```
2. **Install dependencies**
   ```bash
   yarn install
   cd tailscale-embed
   go mod tidy
   ```
   > `go mod tidy` is optional. This project repository already includes pre-compiled DLL files. You can skip this step if you do not need to recompile.
3. **Configure environment variables**
   Create a `.env` file in the project root directory and configure environment variables as shown in [.env.sample](./.env.sample).
   - `CONTROL_URL` is the Headscale controller address.
   - `SERVER_URL` is the RelayX channel management server address.
   - `NODE_AUTH_KEY` is the Tailscale authentication key.
   - `HEADSCALE_AUTH_KEY` is the Headscale authentication key.
   - `FULLCOPY` is whether to enable full file synchronization.
   - `BASE_DESTINATION` is the target path for file synchronization.
    > `NODE_AUTH_KEY`, `FULLCOPY`, `BASE_DESTINATION`, `SERVER_URL` are all optional configurations.
4. **Start the project in development mode**
   ```bash
   yarn dev
   ```
   > The RNN noise reduction model will be loaded when development starts. Its file is large and will occupy about 30 seconds of Vite preparation time. This issue will not occur in the startup after packaging. In the future, a WASM version of the noise reduction model will be used to replace the existing pure JS version.
5. **Recompile the Tailscale embedded client (Optional)**
   ```bash
   yarn dev:build
   ```
   > Before running this command, please ensure that the Go environment is installed and `go mod tidy` has been run.

## Packaging
```bash
yarn build:fe
yarn build:win
```

## Future Plans
- Replace the existing pure JavaScript version of the noise reduction model with a WASM version to improve performance and reduce loading time.
- Improve the connection handling logic for preset channel users and channel users obtained from the channel service.
- Add support for more platforms, such as full support for macOS and Linux platforms.
- Add file transfer functionality.
- Add user text chat.
- Add file transfer functionality.
- Add user status indicators.
- Improve unit tests and integration tests to enhance code quality and stability.
