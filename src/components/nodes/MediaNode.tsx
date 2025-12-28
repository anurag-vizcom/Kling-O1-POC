import { memo, useState, useRef } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { X, Play, Pause, Image, Film } from 'lucide-react'
import useStore, { MediaData } from '../../store/useStore'

function MediaNode({ id, data, selected }: NodeProps) {
  const mediaData = data as MediaData
  const { deleteNode } = useStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`node-wrapper bg-node-bg border rounded-xl overflow-hidden transition-all duration-200 ${
        selected ? 'border-accent-primary shadow-lg shadow-accent-primary/20' : 'border-node-border'
      }`}
      style={{ width: 220 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-node-border bg-black/20">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded flex items-center justify-center ${
            mediaData.type === 'image' ? 'bg-accent-primary/20 text-accent-primary' : 'bg-accent-secondary/20 text-accent-secondary'
          }`}>
            {mediaData.type === 'image' ? (
              <Image className="w-3 h-3" />
            ) : (
              <Film className="w-3 h-3" />
            )}
          </div>
          <span className="text-xs font-medium text-white/70 truncate max-w-[120px]">
            {mediaData.name}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Media Preview */}
      <div className="relative aspect-video bg-black">
        {mediaData.type === 'image' ? (
          <img
            src={mediaData.url}
            alt={mediaData.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={mediaData.url}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              onEnded={() => setIsPlaying(false)}
            />
            <button
              onClick={togglePlayback}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </div>
            </button>
            {mediaData.duration && (
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white/80">
                {formatDuration(mediaData.duration)}
              </div>
            )}
          </>
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

export default memo(MediaNode)

