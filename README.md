# Node-Based AI Image/Video Editor

A minimalist node-based editor for AI-powered image-to-video generation using FAL AI.

![Node Editor](./preview.png)

## Features

- **Infinite Canvas**: Pan and zoom freely across an unlimited workspace
- **Media Nodes**: Upload images and videos (up to 30 seconds) via drag & drop or the + menu
- **AI Generation Nodes**: Connect images to AI nodes to generate videos using FAL AI models
- **Sections**: Organize your elements with customizable colored sections
- **Multiple Inputs**: Connect multiple images to a single AI node
- **Model Selection**: Choose from different Kling video generation models

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- FAL AI API key ([Get one here](https://fal.ai/dashboard/keys))

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and add your FAL API key
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with your FAL API key:

```
VITE_FAL_KEY=your_fal_api_key_here
```

## Usage

1. **Add Media**: Drag & drop images/videos onto the canvas or use the + button
2. **Add AI Node**: Click the + button and select "AI Video Generator"
3. **Connect**: Drag from the output handle (right side) of a media node to the input handle (left side) of an AI node
4. **Configure**: Select a model and enter a prompt describing the video you want
5. **Generate**: Click the "Generate" button and wait for your AI-generated video

## Tech Stack

- React 18 + TypeScript
- Vite
- React Flow (for node-based UI)
- Tailwind CSS
- Framer Motion
- FAL AI Client
- Zustand (state management)

## Keyboard Shortcuts

- **Delete**: Remove selected nodes
- **Cmd/Ctrl + Scroll**: Zoom in/out
- **Space + Drag**: Pan canvas

## License

MIT

