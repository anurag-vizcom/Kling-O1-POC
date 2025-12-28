import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { 
  X, 
  Sparkles, 
  Play, 
  Loader2, 
  ChevronDown,
  Image as ImageIcon,
  Download
} from 'lucide-react'
import useStore, { AINodeData, MediaData } from '../../store/useStore'
import { fal } from '../../lib/fal'

const AI_MODELS = [
  { id: 'fal-ai/kling-video/v1.5/pro/image-to-video', name: 'Kling 1.5 Pro', description: 'High quality video generation' },
  { id: 'fal-ai/kling-video/v1/standard/image-to-video', name: 'Kling 1.0 Standard', description: 'Fast video generation' },
  { id: 'fal-ai/minimax-video/image-to-video', name: 'MiniMax', description: 'Alternative model' },
]

function AINode({ id, data, selected }: NodeProps) {
  const aiData = data as AINodeData
  const { deleteNode, updateNodeData, getConnectedMediaNodes } = useStore()
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectedMedia = getConnectedMediaNodes(id)
  
  const handleGenerate = async () => {
    if (connectedMedia.length === 0) {
      setError('Connect at least one image')
      return
    }

    if (!aiData.prompt.trim()) {
      setError('Enter a prompt')
      return
    }

    setError(null)
    updateNodeData(id, { isGenerating: true })

    try {
      // Get the first connected image URL
      const firstMedia = connectedMedia[0].data as MediaData
      
      // Convert blob URL to base64 if needed
      let imageUrl = firstMedia.url
      if (imageUrl.startsWith('blob:')) {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        imageUrl = await blobToBase64(blob)
      }

      const result = await fal.subscribe(aiData.model, {
        input: {
          prompt: aiData.prompt,
          image_url: imageUrl,
          duration: '5',
          aspect_ratio: '16:9',
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('Generation in progress...', update.logs)
          }
        },
      })

      // Extract video URL from result
      const videoUrl = (result.data as { video?: { url: string } })?.video?.url
      if (videoUrl) {
        updateNodeData(id, { outputUrl: videoUrl, isGenerating: false })
      } else {
        throw new Error('No video URL in response')
      }
    } catch (err) {
      console.error('Generation failed:', err)
      setError(err instanceof Error ? err.message : 'Generation failed')
      updateNodeData(id, { isGenerating: false })
    }
  }

  const downloadOutput = () => {
    if (aiData.outputUrl) {
      const a = document.createElement('a')
      a.href = aiData.outputUrl
      a.download = 'generated-video.mp4'
      a.click()
    }
  }

  const selectedModel = AI_MODELS.find(m => m.id === aiData.model) || AI_MODELS[0]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`node-wrapper bg-node-bg border rounded-xl overflow-hidden transition-all duration-200 ${
        selected ? 'border-accent-secondary shadow-lg shadow-accent-secondary/20' : 'border-node-border'
      }`}
      style={{ width: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-node-border bg-gradient-to-r from-accent-secondary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-accent-secondary/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
          </div>
          <span className="text-sm font-medium text-white/90">{aiData.label}</span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3"
        style={{ left: -6 }}
      />

      <div className="p-3 space-y-3">
        {/* Connected Inputs */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">
            Image Inputs ({connectedMedia.length})
          </label>
          <div className="flex flex-wrap gap-1.5">
            {connectedMedia.length > 0 ? (
              connectedMedia.map((node) => {
                const media = node.data as MediaData
                return (
                  <div
                    key={node.id}
                    className="w-10 h-10 rounded border border-node-border overflow-hidden"
                  >
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )
              })
            ) : (
              <div className="flex items-center gap-2 text-xs text-white/30 py-2">
                <ImageIcon className="w-4 h-4" />
                <span>Connect images to this node</span>
              </div>
            )}
          </div>
        </div>

        {/* Model Selector */}
        <div className="relative">
          <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">
            Model
          </label>
          <button
            onClick={() => setModelMenuOpen(!modelMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-black/30 border border-node-border rounded-lg text-sm text-white/80 hover:border-white/20 transition-colors"
          >
            <span>{selectedModel.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${modelMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {modelMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 bg-node-bg border border-node-border rounded-lg overflow-hidden z-10 shadow-xl"
            >
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    updateNodeData(id, { model: model.id })
                    setModelMenuOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-white/5 transition-colors ${
                    model.id === aiData.model ? 'bg-accent-secondary/10' : ''
                  }`}
                >
                  <p className="text-sm text-white/90">{model.name}</p>
                  <p className="text-[10px] text-white/40">{model.description}</p>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">
            Prompt
          </label>
          <textarea
            value={aiData.prompt}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            placeholder="Describe the video you want to generate..."
            className="w-full h-20 px-3 py-2 bg-black/30 border border-node-border rounded-lg text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-accent-secondary/50 transition-colors"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <motion.button
          onClick={handleGenerate}
          disabled={aiData.isGenerating}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            aiData.isGenerating
              ? 'bg-accent-secondary/20 text-accent-secondary cursor-wait'
              : 'bg-gradient-to-r from-accent-secondary to-accent-secondary/80 text-white hover:shadow-lg hover:shadow-accent-secondary/30'
          }`}
          whileHover={!aiData.isGenerating ? { scale: 1.02 } : {}}
          whileTap={!aiData.isGenerating ? { scale: 0.98 } : {}}
        >
          {aiData.isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Generate</span>
            </>
          )}
        </motion.button>

        {/* Output Preview */}
        {aiData.outputUrl && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-white/40 block">
              Output
            </label>
            <div className="relative rounded-lg overflow-hidden border border-accent-primary/30">
              <video
                src={aiData.outputUrl}
                className="w-full aspect-video object-cover"
                controls
                loop
              />
              <button
                onClick={downloadOutput}
                className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3"
        style={{ right: -6 }}
      />
    </motion.div>
  )
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default memo(AINode)

