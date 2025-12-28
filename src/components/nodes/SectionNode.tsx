import { memo, useState } from 'react'
import { NodeProps, NodeResizer } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Layers, X, Palette } from 'lucide-react'
import useStore, { SectionData } from '../../store/useStore'

const SECTION_COLORS = [
  '#7c3aed', // Purple
  '#00d4aa', // Teal
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f97316', // Orange
]

function SectionNode({ id, data, selected }: NodeProps) {
  const sectionData = data as SectionData
  const { deleteNode, updateNodeData } = useStore()
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { label: e.target.value })
  }

  const handleLabelBlur = () => {
    setIsEditingLabel(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingLabel(false)
    }
  }

  return (
    <>
      <NodeResizer
        color={sectionData.color}
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full rounded-xl border-2 border-dashed transition-all duration-200"
        style={{
          borderColor: `${sectionData.color}40`,
          backgroundColor: `${sectionData.color}08`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-t-lg"
          style={{ backgroundColor: `${sectionData.color}15` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ backgroundColor: `${sectionData.color}30` }}
            >
              <Layers className="w-3 h-3" style={{ color: sectionData.color }} />
            </div>
            
            {isEditingLabel ? (
              <input
                type="text"
                value={sectionData.label}
                onChange={handleLabelChange}
                onBlur={handleLabelBlur}
                onKeyDown={handleKeyDown}
                autoFocus
                className="bg-transparent text-sm font-medium text-white/90 outline-none border-b border-white/30 focus:border-white/60"
                style={{ width: Math.max(80, sectionData.label.length * 8) }}
              />
            ) : (
              <span
                className="text-sm font-medium text-white/70 cursor-text hover:text-white/90 transition-colors"
                onClick={() => setIsEditingLabel(true)}
              >
                {sectionData.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
              
              {colorPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-full right-0 mt-1 p-2 bg-node-bg border border-node-border rounded-lg shadow-xl z-10"
                >
                  <div className="grid grid-cols-4 gap-1">
                    {SECTION_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          updateNodeData(id, { color })
                          setColorPickerOpen(false)
                        }}
                        className={`w-6 h-6 rounded transition-transform hover:scale-110 ${
                          color === sectionData.color ? 'ring-2 ring-white ring-offset-2 ring-offset-node-bg' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <button
              onClick={() => deleteNode(id)}
              className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Drop Zone Hint */}
        <div className="absolute inset-0 top-10 flex items-center justify-center pointer-events-none">
          <p className="text-xs text-white/20">Drop elements here</p>
        </div>
      </motion.div>
    </>
  )
}

export default memo(SectionNode)

