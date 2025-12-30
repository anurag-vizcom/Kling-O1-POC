import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { 
  X, 
  FastForward, 
  Play, 
  Loader2, 
  Film,
  Image as ImageIcon,
  Download,
  Volume2,
  VolumeX,
  Clock,
  RatioIcon
} from 'lucide-react'
import useStore, { AINodeData, MediaData } from '../../store/useStore'
import { fal } from '../../lib/fal'

const DURATION_OPTIONS = [
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
] as const

const ASPECT_RATIO_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
] as const

function ExtendVideoNode({ id, data, selected }: NodeProps) {
  const aiData = data as AINodeData
  const { deleteNode, updateNodeData, getConnectedVideoNodes, getConnectedImageNodes } = useStore()
  const [error, setError] = useState<string | null>(null)

  const connectedVideos = getConnectedVideoNodes(id)
  const connectedImages = getConnectedImageNodes(id)
  
  const handleGenerate = async () => {
    if (connectedVideos.length === 0) {
      setError('Connect a reference video')
      return
    }

    if (!aiData.prompt.trim()) {
      setError('Enter a prompt')
      return
    }

    setError(null)
    updateNodeData(id, { isGenerating: true })

    try {
      // Get the first connected video URL
      const videoMedia = connectedVideos[0].data as MediaData
      
      // Convert blob URL to base64 if needed
      let videoUrl = videoMedia.url
      if (videoUrl.startsWith('blob:')) {
        const response = await fetch(videoUrl)
        const blob = await response.blob()
        videoUrl = await blobToBase64(blob)
      }

      // Prepare reference image URLs if any
      const imageUrls: string[] = []
      for (const imageNode of connectedImages.slice(0, 4)) {
        const imageMedia = imageNode.data as MediaData
        let imageUrl = imageMedia.url
        if (imageUrl.startsWith('blob:')) {
          const response = await fetch(imageUrl)
          const blob = await response.blob()
          imageUrl = await blobToBase64(blob)
        }
        imageUrls.push(imageUrl)
      }

      // Build input object
      const input: Record<string, unknown> = {
        prompt: aiData.prompt,
        video_url: videoUrl,
        keep_audio: aiData.keepAudio ?? true,
        duration: aiData.duration ?? '5',
        aspect_ratio: aiData.aspectRatio ?? 'auto',
      }

      // Add reference images if available
      if (imageUrls.length > 0) {
        input.image_urls = imageUrls
      }

      const result = await fal.subscribe(aiData.model, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('Extending video...', update.logs)
          }
        },
      })

      // Extract video URL from result
      const outputVideoUrl = (result.data as { video?: { url: string } })?.video?.url
      if (outputVideoUrl) {
        updateNodeData(id, { outputUrl: outputVideoUrl, isGenerating: false })
      } else {
        throw new Error('No video URL in response')
      }
    } catch (err) {
      console.error('Extend failed:', err)
      setError(err instanceof Error ? err.message : 'Extend failed')
      updateNodeData(id, { isGenerating: false })
    }
  }

  const downloadOutput = () => {
    if (aiData.outputUrl) {
      const a = document.createElement('a')
      a.href = aiData.outputUrl
      a.download = 'extended-video.mp4'
      a.click()
    }
  }

  const toggleKeepAudio = () => {
    updateNodeData(id, { keepAudio: !(aiData.keepAudio ?? true) })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`node-wrapper bg-node-bg border rounded-xl overflow-hidden transition-all duration-200 ${
        selected ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-node-border'
      }`}
      style={{ width: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-node-border bg-gradient-to-r from-amber-500/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <FastForward className="w-3.5 h-3.5 text-amber-500" />
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
        {/* Video Input */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">
            Reference Video ({connectedVideos.length})
          </label>
          <div className="flex flex-wrap gap-1.5">
            {connectedVideos.length > 0 ? (
              connectedVideos.slice(0, 1).map((node) => {
                const media = node.data as MediaData
                return (
                  <div
                    key={node.id}
                    className="relative w-full aspect-video rounded border border-amber-500/30 overflow-hidden"
                  >
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white/80">
                      {media.duration ? formatDuration(media.duration) : 'Video'}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center gap-2 text-xs text-white/30 py-2">
                <Film className="w-4 h-4" />
                <span>Connect a reference video (3-10s)</span>
              </div>
            )}
          </div>
        </div>

        {/* Reference Images */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">
            Reference Images ({connectedImages.length}/4)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {connectedImages.length > 0 ? (
              connectedImages.slice(0, 4).map((node, index) => {
                const media = node.data as MediaData
                return (
                  <div
                    key={node.id}
                    className="relative w-10 h-10 rounded border border-node-border overflow-hidden"
                  >
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[9px] text-white/80 font-medium">
                      @Image{index + 1}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center gap-2 text-xs text-white/30 py-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Optional: reference images</span>
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">
            Prompt
          </label>
          <textarea
            value={aiData.prompt}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            placeholder="Based on @Video1, generate the next shot..."
            className="w-full h-20 px-3 py-2 bg-black/30 border border-node-border rounded-lg text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <p className="text-[10px] text-white/30 mt-1">
            Use @Image1, @Image2 for reference images
          </p>
        </div>

        {/* Duration & Aspect Ratio */}
        <div className="grid grid-cols-2 gap-2">
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
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : 'bg-black/20 text-white/50 border border-node-border hover:border-white/20'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 flex items-center gap-1">
              <RatioIcon className="w-3 h-3" />
              Aspect Ratio
            </label>
            <select
              value={aiData.aspectRatio ?? 'auto'}
              onChange={(e) => updateNodeData(id, { aspectRatio: e.target.value as AINodeData['aspectRatio'] })}
              className="w-full px-2 py-1.5 text-[10px] font-medium bg-black/20 border border-node-border rounded text-white/70 focus:outline-none focus:border-amber-500/50"
            >
              {ASPECT_RATIO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Keep Audio Toggle */}
        <button
          onClick={toggleKeepAudio}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
            aiData.keepAudio ?? true
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : 'bg-black/20 border-node-border text-white/50'
          }`}
        >
          <span className="text-xs font-medium">Keep Original Audio</span>
          {aiData.keepAudio ?? true ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

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
              ? 'bg-amber-500/20 text-amber-500 cursor-wait'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:shadow-lg hover:shadow-amber-500/30'
          }`}
          whileHover={!aiData.isGenerating ? { scale: 1.02 } : {}}
          whileTap={!aiData.isGenerating ? { scale: 0.98 } : {}}
        >
          {aiData.isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extending...</span>
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
            <div className="relative rounded-lg overflow-hidden border border-amber-500/30">
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default memo(ExtendVideoNode)

