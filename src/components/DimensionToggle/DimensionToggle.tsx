import { useMatrix, type Dimension } from '../../store/MatrixContext'
import './DimensionToggle.css'

export function DimensionToggle() {
  const { dimension, setDimension } = useMatrix()

  const options: { label: string; value: Dimension }[] = [
    { label: '2D', value: 2 },
    { label: '3D', value: 3 },
  ]

  return (
    <div className="dimension-toggle">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`dim-btn ${dimension === opt.value ? 'active' : ''}`}
          onClick={() => setDimension(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
