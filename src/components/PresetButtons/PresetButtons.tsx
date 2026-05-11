import { useMatrix } from '../../store/MatrixContext'
import { presets22, presets33 } from '../../math/presets'
import './PresetButtons.css'

export function PresetButtons() {
  const { dimension, setMatrix22, setMatrix33 } = useMatrix()
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
              setMatrix22(preset.matrix as any)
            } else {
              setMatrix33(preset.matrix as any)
            }
          }}
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}
