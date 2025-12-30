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
  keepAudio?: boolean
  duration?: '5' | '10'
  aspectRatio?: 'auto' | '16:9' | '9:16' | '1:1'
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
  addGenerateVideoNode: (position: { x: number; y: number }) => void
  addEditVideoNode: (position: { x: number; y: number }) => void
  addExtendVideoNode: (position: { x: number; y: number }) => void
  addSectionNode: (position: { x: number; y: number }) => void
  updateNodeData: (nodeId: string, data: Partial<CustomNodeData>) => void
  deleteNode: (nodeId: string) => void
  getConnectedMediaNodes: (nodeId: string) => Node[]
  getConnectedImageNodes: (nodeId: string) => Node[]
  getConnectedVideoNodes: (nodeId: string) => Node[]
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
  
  addGenerateVideoNode: (position) => {
    const newNode: Node = {
      id: uuid(),
      type: 'generateVideo',
      position,
      data: {
        label: 'Generate Video',
        inputs: [],
        prompt: '',
        isGenerating: false,
        model: 'fal-ai/kling-video/o1/image-to-video',
        duration: '5',
      } as AINodeData,
    }
    set({ nodes: [...get().nodes, newNode] })
  },
  
  addEditVideoNode: (position) => {
    const newNode: Node = {
      id: uuid(),
      type: 'editVideo',
      position,
      data: {
        label: 'Edit Video',
        inputs: [],
        prompt: '',
        isGenerating: false,
        model: 'fal-ai/kling-video/o1/video-to-video/edit',
        keepAudio: true,
      } as AINodeData,
    }
    set({ nodes: [...get().nodes, newNode] })
  },
  
  addExtendVideoNode: (position) => {
    const newNode: Node = {
      id: uuid(),
      type: 'extendVideo',
      position,
      data: {
        label: 'Extend Video',
        inputs: [],
        prompt: '',
        isGenerating: false,
        model: 'fal-ai/kling-video/o1/video-to-video/reference',
        keepAudio: true,
        duration: '5',
        aspectRatio: 'auto',
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
  
  getConnectedImageNodes: (nodeId) => {
    const { nodes, edges } = get()
    const connectedEdges = edges.filter((edge) => edge.target === nodeId)
    const connectedNodeIds = connectedEdges.map((edge) => edge.source)
    return nodes.filter(
      (node) => 
        connectedNodeIds.includes(node.id) && 
        node.type === 'media' && 
        (node.data as MediaData).type === 'image'
    )
  },
  
  getConnectedVideoNodes: (nodeId) => {
    const { nodes, edges } = get()
    const connectedEdges = edges.filter((edge) => edge.target === nodeId)
    const connectedNodeIds = connectedEdges.map((edge) => edge.source)
    return nodes.filter(
      (node) => 
        connectedNodeIds.includes(node.id) && 
        node.type === 'media' && 
        (node.data as MediaData).type === 'video'
    )
  },
}))

export default useStore
