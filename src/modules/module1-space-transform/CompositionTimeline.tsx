import './CompositionTimeline.css'

interface CompositionTimelineProps {
  progress: number // [0, 1]
  playing: boolean
  speed: number
  onPlayToggle: () => void
  onProgressChange: (t: number) => void
  onSpeedChange: (s: number) => void
}

const SPEEDS = [0.25, 0.5, 1, 2]

export function CompositionTimeline({
  progress,
  playing,
  speed,
  onPlayToggle,
  onProgressChange,
  onSpeedChange,
}: CompositionTimelineProps) {
  return (
    <div className="comp-timeline">
      <div className="comp-timeline-controls">
        <button className="comp-tl-btn" onClick={onPlayToggle}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="comp-tl-btn" onClick={() => onProgressChange(0)}>
          {'⏮'}
        </button>
        <div className="comp-tl-speed-group">
          {SPEEDS.map(s => (
            <button
              key={s}
              className={`comp-tl-speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="comp-tl-track-container">
        <div className="comp-tl-track">
          <div
            className="comp-tl-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div
          className="comp-tl-scrubber"
          style={{ left: `${progress * 100}%` }}
        />
        <input
          type="range"
          className="comp-tl-range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={e => onProgressChange(parseFloat(e.target.value))}
        />
      </div>

      <div className="comp-tl-label">
        A &rarr; B &times; A
      </div>
    </div>
  )
}
