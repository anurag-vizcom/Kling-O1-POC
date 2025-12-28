import { create } from 'zustand'
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react'
import { v4 as uuid } from 'uuid'

export type MediaType = 'image' | 'video'

export interface MediaData {
  id: string
  type: MediaType
  url: string
  name: string
  duration?: number
}

export interface AINodeData {
  label: string
  inputs: string[]
  prompt: string
  isGenerating: boolean
  outputUrl?: string
  model: string
}

export interface SectionData {
  label: string
  color: string
}

export type CustomNodeData = MediaData | AINodeData | SectionData

interface EditorState {
  nodes: Node[]
  edges: Edge[]
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addMediaNode: (media: MediaData, position: { x: number; y: number }) => void
  addAINode: (position: { x: number; y: number }) => void
  addSectionNode: (position: { x: number; y: number }) => void
  updateNodeData: (nodeId: string, data: Partial<CustomNodeData>) => void
  deleteNode: (nodeId: string) => void
  getConnectedMediaNodes: (nodeId: string) => Node[]
}

const useStore = create<EditorState>((set, get) => ({
  nodes: [],
  edges: [],
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    })
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    })
  },
  
  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
        },
        get().edges
      ),
    })
  },
  
  addMediaNode: (media, position) => {
    const newNode: Node = {
      id: uuid(),
      type: 'media',
      position,
      data: media,
    }
    set({ nodes: [...get().nodes, newNode] })
  },
  
  addAINode: (position) => {
    const newNode: Node = {
      id: uuid(),
      type: 'ai',
      position,
      data: {
        label: 'AI Video Generator',
        inputs: [],
        prompt: '',
        isGenerating: false,
        model: 'fal-ai/kling-video/v1.5/pro/image-to-video',
      } as AINodeData,
    }
    set({ nodes: [...get().nodes, newNode] })
  },
  
  addSectionNode: (position) => {
    const colors = ['#7c3aed', '#00d4aa', '#f59e0b', '#ef4444', '#3b82f6']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const newNode: Node = {
      id: uuid(),
      type: 'section',
      position,
      data: {
        label: 'New Section',
        color: randomColor,
      } as SectionData,
      style: { width: 400, height: 300 },
      zIndex: -1,
    }
    set({ nodes: [...get().nodes, newNode] })
  },
  
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    })
  },
  
  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    })
  },
  
  getConnectedMediaNodes: (nodeId) => {
    const { nodes, edges } = get()
    const connectedEdges = edges.filter((edge) => edge.target === nodeId)
    const connectedNodeIds = connectedEdges.map((edge) => edge.source)
    return nodes.filter(
      (node) => connectedNodeIds.includes(node.id) && node.type === 'media'
    )
  },
}))

export default useStore

