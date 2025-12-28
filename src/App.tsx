import { ReactFlowProvider } from '@xyflow/react'
import Canvas from './components/Canvas'
import TopBar from './components/TopBar'
import '@xyflow/react/dist/style.css'

function App() {
  return (
    <ReactFlowProvider>
      <div className="w-screen h-screen bg-canvas-bg overflow-hidden flex flex-col">
        <TopBar />
        <div className="flex-1">
          <Canvas />
        </div>
      </div>
    </ReactFlowProvider>
  )
}

export default App

