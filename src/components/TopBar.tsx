import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Video, Layers, X, Image, Film } from 'lucide-react'
import useStore from '../store/useStore'
import { useReactFlow } from '@xyflow/react'

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { addAINode, addSectionNode, addMediaNode } = useStore()
  const { getViewport } = useReactFlow()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getCanvasCenter = () => {
    const viewport = getViewport()
    return {
      x: (-viewport.x + window.innerWidth / 2) / viewport.zoom,
      y: (-viewport.y + window.innerHeight / 2) / viewport.zoom,
    }
  }

  const handleAddAINode = () => {
    const center = getCanvasCenter()
    addAINode({ x: center.x - 150, y: center.y - 100 })
    setMenuOpen(false)
  }

  const handleAddSection = () => {
    const center = getCanvasCenter()
    addSectionNode({ x: center.x - 200, y: center.y - 150 })
    setMenuOpen(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const center = getCanvasCenter()
    let offsetX = 0

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) return

      const url = URL.createObjectURL(file)

      if (isVideo) {
        const video = document.createElement('video')
        video.src = url
        video.onloadedmetadata = () => {
          if (video.duration > 30) {
            alert(`${file.name}: Video must be 30 seconds or less`)
            URL.revokeObjectURL(url)
            return
          }

          addMediaNode(
            {
              id: crypto.randomUUID(),
              type: 'video',
              url,
              name: file.name,
              duration: video.duration,
            },
            { x: center.x - 100 + offsetX, y: center.y - 75 }
          )
          offsetX += 250
        }
      } else {
        addMediaNode(
          {
            id: crypto.randomUUID(),
            type: 'image',
            url,
            name: file.name,
          },
          { x: center.x - 100 + offsetX, y: center.y - 75 }
        )
        offsetX += 250
      }
    })

    setMenuOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.add-menu-container')) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div className="h-14 bg-node-bg border-b border-node-border flex items-center justify-center px-4 relative z-50">
      {/* Logo */}
      <div className="absolute left-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
          <Film className="w-4 h-4 text-black" />
        </div>
        <span className="text-sm font-medium text-white/80">Node Editor</span>
      </div>

      {/* Add Button */}
      <div className="add-menu-container relative">
        <motion.button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 rounded-lg text-accent-primary hover:bg-accent-primary/20 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{ rotate: menuOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </motion.div>
          <span className="text-sm font-medium">Add</span>
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-node-bg border border-node-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-2">
                <p className="px-3 py-2 text-xs text-white/40 uppercase tracking-wider">
                  Add to Canvas
                </p>

                <MenuItem
                  icon={<Video className="w-4 h-4" />}
                  label="AI Video Generator"
                  description="Generate videos with AI"
                  color="accent-secondary"
                  onClick={handleAddAINode}
                />

                <MenuItem
                  icon={<Layers className="w-4 h-4" />}
                  label="Section"
                  description="Organize your elements"
                  color="accent-warning"
                  onClick={handleAddSection}
                />

                <div className="h-px bg-node-border my-2" />

                <p className="px-3 py-2 text-xs text-white/40 uppercase tracking-wider">
                  Upload Media
                </p>

                <MenuItem
                  icon={<Image className="w-4 h-4" />}
                  label="Upload Image"
                  description="Add images to canvas"
                  color="accent-primary"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'image/*'
                      fileInputRef.current.click()
                    }
                  }}
                />

                <MenuItem
                  icon={<Film className="w-4 h-4" />}
                  label="Upload Video"
                  description="Add videos (max 30s)"
                  color="accent-primary"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'video/*'
                      fileInputRef.current.click()
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          multiple
        />
      </div>

      {/* Keyboard shortcut hint */}
      <div className="absolute right-4 text-xs text-white/30">
        Drag & drop media onto canvas
      </div>
    </div>
  )
}

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  description: string
  color: string
  onClick: () => void
}

function MenuItem({ icon, label, description, color, onClick }: MenuItemProps) {
  const colorClasses: Record<string, string> = {
    'accent-primary': 'text-accent-primary bg-accent-primary/10',
    'accent-secondary': 'text-accent-secondary bg-accent-secondary/10',
    'accent-warning': 'text-accent-warning bg-accent-warning/10',
  }

  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
      whileHover={{ x: 4 }}
      transition={{ duration: 0.1 }}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white/90">{label}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
    </motion.button>
  )
}

