# RelayX
RelayX is a serverless voice chat software based on Tailscale network, built with electron, react and pion/webrtc.
RelayX aims to create a user-controlled voice communication platform without the need for central servers.

## About this project
[https://relayx.pages.dev](https://relayx.pages.dev/)


## setup development environment

### About CPA
RelayX integrates a Capture Process Audio (CPA) component to capture audio from specific processes in Windows. This component is built using C++ and leverages Windows Core Audio APIs to achieve process audio capture.
see [process-audio-capture-stdio](https://github.com/Need-an-AwP/process-audio-capture-stdio) repo for more details.

### Environment Requirements
- Node.js 20+
- Go 1.24+
- Windows

### Install Dependencies
```bash
# Install frontend dependencies
yarn install

# Download capture process audio component
yarn downloadCPA

# Build Go backend
yarn build:go
```

### Development Mode
```bash
# Start development server
yarn dev
```

### Production Build
```bash
# Build complete application
yarn build
```

## Config files
- `config.json`: Main configuration file for RelayX
- `.env`: Tailscale authentication key and hostname (the empty env file will be created even if user don't use authkey to login)


## License

This project uses the apache License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tailscale](https://tailscale.com/) - Provides secure network connections
- [WebRTC](https://webrtc.org/) - Real-time communication technology
- [Electron](https://electronjs.org/) - Desktop application framework
- [Pion WebRTC](https://github.com/pion/webrtc) - Go WebRTC implementation
- [RNNoise](https://jmvalin.ca/demo/rnnoise/) - Noise suppression
- [shadcn/ui](https://ui.shadcn.com/) - UI components
