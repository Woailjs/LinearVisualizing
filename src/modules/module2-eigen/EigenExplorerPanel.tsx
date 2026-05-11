import { useMatrix } from '../../store/MatrixContext'
import type { EigenResult2, EigenResult3 } from '../../math/types'
import { VectorDialCanvas } from './VectorDialCanvas'

export function EigenExplorerPanel() {
  const { dimension, eigenResult } = useMatrix()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
      {/* Horizontal eigen info bar */}
      <EigenInfoBar dimension={dimension} eigen={eigenResult} />

      {/* Canvas */}
      {dimension === 2 && (
        <div style={{ flex: 1, position: 'relative', minHeight: 280 }}>
          <VectorDialCanvas />
        </div>
      )}

      {dimension === 3 && (
        <div style={{ color: 'var(--muted)', fontSize: '14px', padding: 8 }}>
          3D 特征向量探测：请使用上方基础变换模块中的 3D 视图观察旋转。
          {!eigenResult.allReal && (
            <span style={{ color: 'var(--coral)', display: 'block', marginTop: 8 }}>
              该矩阵存在复特征值，空间中不存在不变方向的实特征向量。
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function EigenInfoBar({ dimension, eigen }: { dimension: number; eigen: EigenResult2 | EigenResult3 }) {
  const values = eigen.values
  const vectors = eigen.vectors

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      fontSize: '14px',
      lineHeight: 1.5,
      padding: '10px 14px',
      background: '#f8f8f8',
      borderRadius: 8,
      flexWrap: 'wrap',
    }}>
      {/* Eigenvalues */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap' }}>特征值 λ：</span>
        {values.map((v, i) => (
          <span key={i} style={{
            color: Math.abs(v.imag) < 1e-12 ? 'var(--ink)' : 'var(--coral)',
            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}>
            λ<sub>{i + 1}</sub> = {Math.abs(v.imag) < 1e-12
              ? v.real.toFixed(3)
              : `${v.real.toFixed(2)}±${Math.abs(v.imag).toFixed(2)}i`}
          </span>
        ))}
      </div>

      {/* Separator */}
      <span style={{ color: 'var(--hairline)' }}>|</span>

      {/* Eigenvectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap' }}>特征向量 v：</span>
        {eigen.allReal && vectors.length > 0 ? (
          vectors.map((v, i) => (
            <span key={i} style={{ color: 'var(--muted)', fontFamily: "'JetBrains Mono', 'Consolas', monospace", fontSize: '13px', whiteSpace: 'nowrap' }}>
              v<sub>{i + 1}</sub> = ({v.x.toFixed(2)}, {v.y.toFixed(2)})
            </span>
          ))
        ) : (
          <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
            {eigen.allReal ? '—' : '复特征值，无实向量'}
          </span>
        )}
      </div>
    </div>
  )
}
