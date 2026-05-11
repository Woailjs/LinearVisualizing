import { MatrixProvider } from './store/MatrixContext'
import { DimensionToggle } from './components/DimensionToggle/DimensionToggle'
import { MatrixInput } from './components/MatrixInput/MatrixInput'
import { PresetButtons } from './components/PresetButtons/PresetButtons'
import { Panel } from './components/common/Panel'
import { SpaceTransformPanel } from './modules/module1-space-transform/SpaceTransformPanel'
import { EigenExplorerPanel } from './modules/module2-eigen/EigenExplorerPanel'
import { SVDDeconstructorPanel } from './modules/module3-svd/SVDDeconstructorPanel'

function AppContent() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">LinearVision</h1>
        <span className="app-subtitle">线性代数几何变换可视化</span>
      </header>

      <div className="control-bar">
        <DimensionToggle />
        <MatrixInput />
        <PresetButtons />
      </div>

      <div className="panels-grid">
        <div className="panel-col panel-col-wide">
          <Panel title="1. 基础空间变换与映射" defaultOpen={true}>
            <SpaceTransformPanel />
          </Panel>
        </div>
        <div className="panel-col">
          <Panel title="2. 特征值与特征向量探测" defaultOpen={true}>
            <EigenExplorerPanel />
          </Panel>
        </div>
      </div>

      <div className="panels-bottom">
        <Panel title="3. 奇异值分解 (SVD) 动态解构" defaultOpen={true}>
          <SVDDeconstructorPanel />
        </Panel>
      </div>
    </div>
  )
}

function App() {
  return (
    <MatrixProvider>
      <AppContent />
    </MatrixProvider>
  )
}

export default App
