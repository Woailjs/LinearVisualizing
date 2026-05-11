import './SVDDeconstructorPanel.css'

interface TimelineControllerProps {
  progress: number // [0, 3]
  playing: boolean
  speed: number
  onPlayToggle: () => void
  onProgressChange: (t: number) => void
  onSpeedChange: (s: number) => void
}

const STAGES = [
  { label: 'V^T (旋转/反射)', range: [0, 1] as [number, number], color: '#e94560' },
  { label: 'Σ (拉伸/压缩)', range: [1, 2] as [number, number], color: '#0f9b8e' },
  { label: 'U (旋转/反射)', range: [2, 3] as [number, number], color: '#4488ff' },
]

const SPEEDS = [0.25, 0.5, 1, 2]

export function TimelineController({
  progress,
  playing,
  speed,
  onPlayToggle,
  onProgressChange,
  onSpeedChange,
}: TimelineControllerProps) {
  const activeStage = STAGES.find(s => progress >= s.range[0] && progress < s.range[1])
    ?? STAGES[STAGES.length - 1]

  return (
    <div className="timeline">
      <div className="timeline-controls">
        <button className="tl-btn" onClick={onPlayToggle}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="tl-btn" onClick={() => onProgressChange(0)}>
          ⏮
        </button>
        <div className="tl-speed-group">
          {SPEEDS.map(s => (
            <button
              key={s}
              className={`tl-speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="tl-track-container">
        {/* Stage markers */}
        <div className="tl-stages">
          {STAGES.map((stage, i) => {
            const left = (stage.range[0] / 3) * 100
            const width = ((stage.range[1] - stage.range[0]) / 3) * 100
            const active = progress >= stage.range[0] && progress <= stage.range[1]
            return (
              <div
                key={i}
                className={`tl-stage-segment ${active ? 'active' : ''}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: active ? stage.color : 'transparent',
                }}
              />
            )
          })}
          {/* Scrubber handle */}
          <div
            className="tl-scrubber"
            style={{ left: `${(progress / 3) * 100}%` }}
          />
          {/* Invisible range input for dragging */}
          <input
            type="range"
            className="tl-range"
            min={0}
            max={3}
            step={0.001}
            value={progress}
            onChange={e => onProgressChange(parseFloat(e.target.value))}
          />
        </div>

        <div className="tl-stage-labels">
          {STAGES.map((stage, i) => (
            <span
              key={i}
              className="tl-stage-label"
              style={{
                left: `${((stage.range[0] + stage.range[1]) / 6) * 100}%`,
                color: progress >= stage.range[0] && progress <= stage.range[1] ? stage.color : undefined,
              }}
            >
              {stage.label}
            </span>
          ))}
        </div>
      </div>

      <div className="tl-current-stage">
        当前阶段：<span style={{ color: activeStage.color }}>{activeStage.label}</span>
      </div>
    </div>
  )
}
