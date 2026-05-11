import { useMatrix } from '../../store/MatrixContext'
import type { EigenResult2, EigenResult3 } from '../../math/types'
import { VectorDialCanvas } from './VectorDialCanvas'

export function EigenExplorerPanel() {
  const { dimension, eigenResult } = useMatrix()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      {/* Eigen info */}
      <EigenInfo dimension={dimension} eigen={eigenResult} />

      {/* Vector dial (2D only for now) */}
      {dimension === 2 && (
        <div style={{ flex: 1, position: 'relative', minHeight: 280 }}>
          <VectorDialCanvas />
        </div>
      )}

      {dimension === 3 && (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', padding: 8 }}>
          3D 特征向量探测：请使用上方基础变换模块中的 3D 视图观察旋转。
          {!eigenResult.allReal && (
            <span style={{ color: '#ff6666', display: 'block', marginTop: 8 }}>
              ⚠ 该矩阵存在复特征值，空间中不存在不变方向的实特征向量。
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function EigenInfo({ dimension, eigen }: { dimension: number; eigen: EigenResult2 | EigenResult3 }) {
  const values = eigen.values

  return (
    <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--accent3)' }}>
        特征值 (λ)：
      </div>
      {values.map((v, i) => (
        <div key={i} style={{ color: Math.abs(v.imag) < 1e-12 ? 'var(--text-primary)' : '#ff8844' }}>
          λ{i + 1} = {Math.abs(v.imag) < 1e-12
            ? v.real.toFixed(3)
            : `${v.real.toFixed(2)} ± ${Math.abs(v.imag).toFixed(2)}i`}
        </div>
      ))}

      {eigen.allReal && eigen.vectors.length > 0 && (
        <>
          <div style={{ fontWeight: 600, marginTop: 8, marginBottom: 4, color: 'var(--accent3)' }}>
            特征向量：
          </div>
          {eigen.vectors.map((v, i) => (
            <div key={i} style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              v{i + 1} = ({v.x.toFixed(2)}, {v.y.toFixed(2)})
            </div>
          ))}
        </>
      )}
    </div>
  )
}
