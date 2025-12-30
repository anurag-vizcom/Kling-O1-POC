import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
} from '@xyflow/react'
import useStore from '../store/useStore'
import MediaNode from './nodes/MediaNode'
import GenerateVideoNode from './nodes/GenerateVideoNode'
import EditVideoNode from './nodes/EditVideoNode'
import SectionNode from './nodes/SectionNode'

const nodeTypes: NodeTypes = {
  media: MediaNode,
  generateVideo: GenerateVideoNode,
  editVideo: EditVideoNode,
  section: SectionNode,
}

export default function Canvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addMediaNode,
  } = useStore()
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      
      const files = event.dataTransfer.files
      if (files.length === 0) return

      const file = files[0]
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) return

      const rect = reactFlowWrapper.current?.getBoundingClientRect()
      if (!rect) return

      const url = URL.createObjectURL(file)
      
      if (isVideo) {
        const video = document.createElement('video')
        video.src = url
        video.onloadedmetadata = () => {
          if (video.duration > 30) {
            alert('Video must be 30 seconds or less')
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
            {
              x: event.clientX - rect.left - 100,
              y: event.clientY - rect.top - 75,
            }
          )
        }
      } else {
        addMediaNode(
          {
            id: crypto.randomUUID(),
            type: 'image',
            url,
            name: file.name,
          },
          {
            x: event.clientX - rect.left - 100,
            y: event.clientY - rect.top - 75,
          }
        )
      }
    },
    [addMediaNode]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#2a2a2e"
        />
        <Controls className="!bottom-4 !left-4" />
        <MiniMap
          className="!bottom-4 !right-4"
          nodeColor={(node) => {
            switch (node.type) {
              case 'media':
                return '#00d4aa'
              case 'generateVideo':
                return '#7c3aed'
              case 'editVideo':
                return '#00d4aa'
              case 'section':
                return '#3a3a40'
              default:
                return '#2a2a2e'
            }
          }}
          maskColor="rgba(10, 10, 11, 0.8)"
        />
      </ReactFlow>
    </div>
  )
}
