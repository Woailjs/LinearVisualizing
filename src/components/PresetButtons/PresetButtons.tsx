import { useMatrix } from '../../store/MatrixContext'
import { presets22, presets33 } from '../../math/presets'
import './PresetButtons.css'

export function PresetButtons() {
  const { dimension, setMatrixB22, setMatrixB33 } = useMatrix()
  const presets = dimension === 2 ? presets22 : presets33

  return (
    <div className="preset-buttons">
      {presets.map((preset, i) => (
        <button
          key={i}
          className="preset-btn"
          title={preset.description}
          onClick={() => {
            if (dimension === 2) {
              setMatrixB22(preset.matrix as any)
            } else {
              setMatrixB33(preset.matrix as any)
            }
          }}
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}
