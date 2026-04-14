<p align="center">
  <img src="https://raw.githubusercontent.com/Icecubesaad/OpenLLM-Studio/main/public/logo.png" width="120" alt="OpenLLM Studio Logo" />
</p>

<h1 align="center">OpenLLM Studio</h1>

<p align="center">
  <strong>Run local LLMs without the hassle</strong>
</p>

<p align="center">
  <a href="https://github.com/Icecubesaad/OpenLLM-Studio/stargazers">
    <img src="https://img.shields.io/github/stars/Icecubesaad/OpenLLM-Studio?color=yellow&style=flat" alt="Stars">
  </a>
  <a href="https://github.com/Icecubesaad/OpenLLM-Studio/commits/main">
    <img src="https://img.shields.io/github/last-commit/Icecubesaad/OpenLLM-Studio/main" alt="Last Commit">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/Icecubesaad/OpenLLM-Studio" alt="License">
  </a>
  <a href="https://github.com/Icecubesaad/OpenLLM-Studio/releases">
    <img src="https://img.shields.io/github/v/release/Icecubesaad/OpenLLM-Studio?include_prereleases&style=flat" alt="Release">
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Install</a> •
  <a href="#building-from-source">Build</a> •
  <a href="#runtime-binaries">Binaries</a> •
  <a href="#contributing">Contribute</a>
</p>

---

A beautiful, modern desktop application for managing and interacting with local AI models. Run AI entirely on your machine — no data leaves your computer.

```
┌─────────────────────────────────────┐
│  INSTALLER SIZE         ████████ 5MB│
│  GPU ACCELERATION       ████████ YES │
│  PRIVACY                ████████ 100%│
│  OFFLINE                ████████ YES │
└─────────────────────────────────────┘
```

- **Tiny installer** — 5MB download, binaries fetched on-demand
- **GPU acceleration** — Auto-detect and download CUDA/Vulkan/Metal binaries
- **100% private** — Everything runs locally, no data leaves your machine
- **HuggingFace integration** — Search and download GGUF models directly
- **AI-powered recommendations** — Get model suggestions based on your hardware

## Features

### 🎨 Modern UI
- Clean, dark-themed interface with smooth animations
- Intuitive navigation and responsive design
- Real-time progress indicators for downloads

### 📚 Model Management
- **My Library**: View and manage your downloaded models
- **Browse**: Discover curated AI models optimized for local execution
- **HuggingFace Integration**: Search and download GGUF models from HuggingFace
- **Model Wizard**: AI-powered recommendations based on your hardware

### 💬 Chat Interface
- Multi-conversation support
- Real-time streaming responses
- Model switching on the fly
- Conversation history

### ⚡ Smart Downloads
- Automatic retry on network failures (up to 3 attempts)
- Resume capability for interrupted downloads
- Real-time progress tracking
- Intelligent error handling

### 🔧 Advanced Features
- Hardware detection (GPU, RAM, CPU)
- On-demand binary downloads for GPU acceleration
- Optimization settings
- License management (Pro features)
- Performance dashboard

---

## Installation

### Download Pre-built Binaries

Download the latest release for your platform:

| Platform | Download | Size |
|----------|----------|------|
| Windows | `OpenLLM-Studio_x64-setup.exe` | ~5 MB |
| macOS (Apple Silicon) | Coming Soon | - |
| macOS (Intel) | Coming Soon | - |
| Linux | Coming Soon | - |

### First Run Experience

On first launch, the app will:
1. **Detect your hardware** — GPU, RAM, CPU
2. **Recommend the best runtime** — CPU, CUDA, Vulkan, or Metal
3. **Download optimized binaries** — Only what you need (~100-200 MB)

This keeps the installer tiny while ensuring you get GPU acceleration when available.

---

## Building from Source

### Prerequisites

- **Node.js** 20.19+ or 22.12+
- **Rust** (latest stable)
- **System dependencies** (see below)

### System Dependencies

#### Windows
```bash
# Install Microsoft Visual Studio C++ Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

#### macOS
```bash
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libgtk-3-dev libayatana-appindicator3-dev
```

### Build Steps

1. Clone the repository:
```bash
git clone https://github.com/Icecubesaad/OpenLLM-Studio.git
cd OpenLLM-Studio
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run tauri dev
```

4. Build for production:
```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

---

## Runtime Binaries

OpenLLM Studio uses [llama.cpp](https://github.com/ggml-org/llama.cpp/releases) binaries for local inference. These are downloaded on-demand based on your hardware.

### Available Variants

| Variant | Platform | Description |
|---------|----------|-------------|
| CPU | All | Pure CPU inference |
| CUDA 12.4 | Windows, Linux | NVIDIA GPUs |
| CUDA 13.1 | Windows, Linux | NVIDIA GPUs (newer) |
| Vulkan | Windows, Linux | AMD/Intel GPUs |
| Metal | macOS | Apple Silicon |

### Manual Download

If you prefer to manually download binaries, get them from the official [llama.cpp releases](https://github.com/ggml-org/llama.cpp/releases) page.

### Binary Storage

- **Windows**: `%APPDATA%\com.openllm.studio\llama-binaries\`
- **macOS**: `~/Library/Application Support/com.openllm.studio/llama-binaries/`
- **Linux**: `~/.config/com.openllm.studio/llama-binaries/`

---

## Configuration

### HuggingFace Token

For accessing private models or increased rate limits:
1. Go to Settings
2. Navigate to HuggingFace section
3. Enter your HF token

---

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Rust + Tauri v2
- **Database**: SQLite
- **AI Runtime**: llama.cpp (on-demand download)
- **Model Recommendations**: OpenRouter API

---

## Project Structure

```
OpenLLM-Studio/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── lib/                # Utilities and types
│   └── store/              # State management
├── src-tauri/              # Rust backend
│   ├── src/                # Rust source code
│   ├── migrations/         # Database migrations
│   └── icons/              # App icons
├── .github/workflows/      # CI/CD pipelines
└── public/                 # Static assets
```

---

## Development

### Frontend Development
```bash
npm run dev
```

### Backend Development
```bash
cd src-tauri
cargo check
cargo test
```

### Type Checking
```bash
npm run build
```

---

## Troubleshooting

### GPU Not Detected

1. Ensure you have the latest GPU drivers installed
2. For NVIDIA: Install [CUDA Toolkit](https://developer.nvidia.com/cuda-downloads)
3. For AMD: Install latest drivers from [AMD Support](https://www.amd.com/en/support)
4. Check Settings → General → Hardware Info

### Binary Download Fails

1. Check your internet connection
2. Try a different variant (Settings → General → Runtime Engine)
3. Use CPU variant as fallback
4. Check firewall/proxy settings

### Build Errors

1. Ensure Node.js version is 20.19+ or 22.12+
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Clear Rust build cache: `cd src-tauri && cargo clean`
4. Install system dependencies (see above)

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [llama.cpp](https://github.com/ggml-org/llama.cpp) - High-performance LLM inference
- [Tauri](https://tauri.app) - Desktop application framework
- [React](https://react.dev) - UI framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [HuggingFace](https://huggingface.co) - Model hosting