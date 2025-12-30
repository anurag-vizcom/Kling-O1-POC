import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { 
  X, 
  Wand2, 
  Play, 
  Loader2, 
  Film,
  Image as ImageIcon,
  Download,
  Volume2,
  VolumeX
} from 'lucide-react'
import useStore, { AINodeData, MediaData } from '../../store/useStore'
import { fal } from '../../lib/fal'

function EditVideoNode({ id, data, selected }: NodeProps) {
  const aiData = data as AINodeData
  const { deleteNode, updateNodeData, getConnectedVideoNodes, getConnectedImageNodes } = useStore()
  const [error, setError] = useState<string | null>(null)

  const connectedVideos = getConnectedVideoNodes(id)
  const connectedImages = getConnectedImageNodes(id)
  
  const handleGenerate = async () => {
    if (connectedVideos.length === 0) {
      setError('Connect a video to edit')
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
            console.log('Edit in progress...', update.logs)
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
      console.error('Edit failed:', err)
      setError(err instanceof Error ? err.message : 'Edit failed')
      updateNodeData(id, { isGenerating: false })
    }
  }

  const downloadOutput = () => {
    if (aiData.outputUrl) {
      const a = document.createElement('a')
      a.href = aiData.outputUrl
      a.download = 'edited-video.mp4'
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
        selected ? 'border-accent-primary shadow-lg shadow-accent-primary/20' : 'border-node-border'
      }`}
      style={{ width: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-node-border bg-gradient-to-r from-accent-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-accent-primary/20 flex items-center justify-center">
            <Wand2 className="w-3.5 h-3.5 text-accent-primary" />
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
            Video Input ({connectedVideos.length})
          </label>
          <div className="flex flex-wrap gap-1.5">
            {connectedVideos.length > 0 ? (
              connectedVideos.slice(0, 1).map((node) => {
                const media = node.data as MediaData
                return (
                  <div
                    key={node.id}
                    className="relative w-full aspect-video rounded border border-accent-primary/30 overflow-hidden"
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
                <span>Connect a video to edit (3-10s)</span>
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
            placeholder="Use @Image1, @Image2 to reference images..."
            className="w-full h-20 px-3 py-2 bg-black/30 border border-node-border rounded-lg text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-accent-primary/50 transition-colors"
          />
          <p className="text-[10px] text-white/30 mt-1">
            Reference images as @Image1, @Image2, etc.
          </p>
        </div>

        {/* Keep Audio Toggle */}
        <button
          onClick={toggleKeepAudio}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
            aiData.keepAudio ?? true
              ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
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
              ? 'bg-accent-primary/20 text-accent-primary cursor-wait'
              : 'bg-gradient-to-r from-accent-primary to-accent-primary/80 text-black hover:shadow-lg hover:shadow-accent-primary/30'
          }`}
          whileHover={!aiData.isGenerating ? { scale: 1.02 } : {}}
          whileTap={!aiData.isGenerating ? { scale: 0.98 } : {}}
        >
          {aiData.isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Editing...</span>
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

export default memo(EditVideoNode)
