import { useCallback } from 'react'
import { useMatrix } from '../../store/MatrixContext'
import type { Mat2x2, Mat3x3 } from '../../math/types'
import './MatrixInput.css'

export function MatrixInput() {
  const { dimension, matrix22, matrix33, setMatrix22, setMatrix33 } = useMatrix()

  const handleChange = useCallback(
    (row: number, col: number, value: string) => {
      const num = parseFloat(value)
      if (isNaN(num)) return

      if (dimension === 2) {
        const newM = matrix22.map(r => [...r]) as Mat2x2
        newM[row][col] = num
        setMatrix22(newM)
      } else {
        const newM = matrix33.map(r => [...r]) as Mat3x3
        newM[row][col] = num
        setMatrix33(newM)
      }
    },
    [dimension, matrix22, matrix33, setMatrix22, setMatrix33],
  )

  const size = dimension
  const matrix = dimension === 2 ? matrix22 : matrix33

  return (
    <div className="matrix-input">
      <span className="matrix-bracket">{'['}</span>
      <div className="matrix-grid">
        {Array.from({ length: size }, (_, r) => (
          <div key={r} className="matrix-row">
            {Array.from({ length: size }, (_, c) => (
              <input
                key={c}
                className="matrix-cell"
                type="number"
                step="0.1"
                value={matrix[r][c]}
                onChange={e => handleChange(r, c, e.target.value)}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="matrix-bracket">{']'}</span>
    </div>
  )
}
