import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { 
  X, 
  Sparkles, 
  Play, 
  Loader2, 
  Image as ImageIcon,
  Download,
  Clock,
  ArrowRight
} from 'lucide-react'
import useStore, { AINodeData, MediaData } from '../../store/useStore'
import { fal } from '../../lib/fal'

const DURATION_OPTIONS = [
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
] as const

function GenerateVideoNode({ id, data, selected }: NodeProps) {
  const aiData = data as AINodeData
  const { deleteNode, updateNodeData, getConnectedImageNodes } = useStore()
  const [error, setError] = useState<string | null>(null)

  const connectedImages = getConnectedImageNodes(id)
  const startFrame = connectedImages[0]
  const endFrame = connectedImages[1]
  
  const handleGenerate = async () => {
    if (!startFrame) {
      setError('Connect a start frame image')
      return
    }

    if (!aiData.prompt.trim()) {
      setError('Enter a prompt')
      return
    }

    setError(null)
    updateNodeData(id, { isGenerating: true })

    try {
      // Get start frame URL
      const startMedia = startFrame.data as MediaData
      let startImageUrl = startMedia.url
      if (startImageUrl.startsWith('blob:')) {
        const response = await fetch(startImageUrl)
        const blob = await response.blob()
        startImageUrl = await blobToBase64(blob)
      }

      // Build input object
      const input: Record<string, unknown> = {
        prompt: aiData.prompt,
        start_image_url: startImageUrl,
        duration: aiData.duration ?? '5',
      }

      // Add end frame if available
      if (endFrame) {
        const endMedia = endFrame.data as MediaData
        let endImageUrl = endMedia.url
        if (endImageUrl.startsWith('blob:')) {
          const response = await fetch(endImageUrl)
          const blob = await response.blob()
          endImageUrl = await blobToBase64(blob)
        }
        input.end_image_url = endImageUrl
      }

      const result = await fal.subscribe(aiData.model, {
        input,
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
        {/* Frame Inputs */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">
            Frames (Start → End)
          </label>
          
          <div className="flex items-center gap-2">
            {/* Start Frame */}
            <div className="flex-1">
              <div className="text-[9px] text-white/30 mb-1">Start Frame</div>
              {startFrame ? (
                <div className="relative aspect-video rounded border border-accent-secondary/30 overflow-hidden">
                  <img
                    src={(startFrame.data as MediaData).url}
                    alt="Start frame"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/60 rounded text-[8px] text-accent-secondary">
                    @Image1
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded border border-dashed border-node-border flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-white/20" />
                </div>
              )}
            </div>

            <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />

            {/* End Frame */}
            <div className="flex-1">
              <div className="text-[9px] text-white/30 mb-1">End Frame (optional)</div>
              {endFrame ? (
                <div className="relative aspect-video rounded border border-accent-secondary/30 overflow-hidden">
                  <img
                    src={(endFrame.data as MediaData).url}
                    alt="End frame"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/60 rounded text-[8px] text-accent-secondary">
                    @Image2
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded border border-dashed border-node-border flex items-center justify-center">
                  <span className="text-[9px] text-white/20">Optional</span>
                </div>
              )}
            </div>
          </div>
          
          {!startFrame && (
            <div className="flex items-center gap-2 text-xs text-white/30 mt-2">
              <ImageIcon className="w-4 h-4" />
              <span>Connect 1-2 images for start/end frames</span>
            </div>
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
            placeholder="Describe the transition between frames..."
            className="w-full h-20 px-3 py-2 bg-black/30 border border-node-border rounded-lg text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-accent-secondary/50 transition-colors"
          />
          <p className="text-[10px] text-white/30 mt-1">
            Use @Image1 (start) and @Image2 (end) in prompt
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Duration
          </label>
          <div className="flex gap-1">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateNodeData(id, { duration: option.value })}
                className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded transition-colors ${
                  (aiData.duration ?? '5') === option.value
                    ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30'
                    : 'bg-black/20 text-white/50 border border-node-border hover:border-white/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
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

export default memo(GenerateVideoNode)
