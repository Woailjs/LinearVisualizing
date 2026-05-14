import { MatrixProvider, useMatrix, type Dimension } from './store/MatrixContext'
import { DimensionToggle } from './components/DimensionToggle/DimensionToggle'
import { MatrixInput } from './components/MatrixInput/MatrixInput'
import { PresetButtons } from './components/PresetButtons/PresetButtons'
import { Panel } from './components/common/Panel'
import { SpaceTransformPanel } from './modules/module1-space-transform/SpaceTransformPanel'
import { EigenExplorerPanel } from './modules/module2-eigen/EigenExplorerPanel'
import { SVDDeconstructorPanel } from './modules/module3-svd/SVDDeconstructorPanel'
import type { Mat2x2, Mat3x3 } from './math/types'

function formatNum(n: number): string {
  return Number(n.toFixed(4)).toString()
}

function MatrixResultReadonly({ label, matrix22, matrix33, dimension }: {
  label: string
  matrix22: Mat2x2
  matrix33: Mat3x3
  dimension: Dimension
}) {
  const matrix = dimension === 2 ? matrix22 : matrix33
  const size = dimension

  return (
    <div className="matrix-input">
      <span className="matrix-label" style={{ color: 'var(--module1)' }}>{label}</span>
      <span className="matrix-bracket">{'['}</span>
      <div className="matrix-grid">
        {Array.from({ length: size }, (_, r) => (
          <div key={r} className="matrix-row">
            {Array.from({ length: size }, (_, c) => (
              <span key={c} className="matrix-cell-readonly">
                {formatNum(matrix[r][c])}
              </span>
            ))}
          </div>
        ))}
      </div>
      <span className="matrix-bracket">{']'}</span>
    </div>
  )
}

function AppContent() {
  const { dimension, matrixB22, matrixB33, matrixC22, matrixC33, setMatrixB22, setMatrixB33 } = useMatrix()

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">LinearVision</h1>
        <span className="app-subtitle">线性代数几何变换可视化</span>
      </header>

      <div className="control-bar">
        <DimensionToggle />
        <MatrixInput label="A" />
        <MatrixInput
          label="B"
          matrix22={matrixB22}
          matrix33={matrixB33}
          setMatrix22={setMatrixB22}
          setMatrix33={setMatrixB33}
        />
        <MatrixResultReadonly label="B×A" matrix22={matrixC22} matrix33={matrixC33} dimension={dimension} />
        <PresetButtons />
      </div>

      <div className="panels-grid">
        <div className="panel-col panel-col-wide">
          <Panel title="基础空间变换与映射" eyebrow="Module 1 · Space Transform" accentColor="var(--module1)" defaultOpen={true}>
            <SpaceTransformPanel />
          </Panel>
        </div>
        <div className="panel-col">
          <Panel title="特征值与特征向量探测" eyebrow="Module 2 · Eigen Explorer" accentColor="var(--module2)" defaultOpen={true}>
            <EigenExplorerPanel />
          </Panel>
        </div>
      </div>

      <div className="panels-bottom">
        <Panel title="奇异值分解 (SVD) 动态解构" eyebrow="Module 3 · SVD Deconstructor" accentColor="var(--module3)" defaultOpen={true}>
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
