import { useState, useRef, useEffect } from 'react'
import { useMatrix } from '../../store/MatrixContext'
import { useCanvas2D } from '../../hooks/useCanvas2D'
import { useThreeScene } from '../../hooks/useThreeScene'
import { TimelineController } from './TimelineController'
import { computeTransform2D, computeTransform3D } from './SVDStageRenderer'
import { renderCanvas2D as render2DTransform } from '../module1-space-transform/Canvas2DRenderer'
import { Scene3DRenderer } from '../module1-space-transform/Scene3DRenderer'

const SVD_ZOOM_FACTOR = 1.4

function SVD2D() {
  const { matrix22, svdResult } = useMatrix()
  const svd2 = svdResult as any
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [displayProgress, setDisplayProgress] = useState(0)
  const progressRef = useRef(0)
  const playingRef = useRef(playing)
  const speedRef = useRef(speed)
  playingRef.current = playing
  speedRef.current = speed
  const uiTickRef = useRef(0)
  const zoomRef = useRef(1)

  const canvasRef = useCanvas2D((ctx, w, h, dt) => {
    // Update progress when playing (merged into render loop — single rAF)
    if (playingRef.current) {
      progressRef.current += dt * speedRef.current
      if (progressRef.current >= 3) {
        progressRef.current = 3
        setPlaying(false)
      }
      uiTickRef.current++
      if (uiTickRef.current % 2 === 0) {
        setDisplayProgress(progressRef.current)
      }
    }

    const effectiveMatrix = computeTransform2D(svd2, progressRef.current)
    render2DTransform(ctx, w, h, effectiveMatrix, performance.now() / 1000, zoomRef.current)
  })

  // Non-passive wheel listener — blocks page scroll
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1 / SVD_ZOOM_FACTOR : SVD_ZOOM_FACTOR
      zoomRef.current = Math.max(0.1, Math.min(10, zoomRef.current * factor))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <TimelineController
        progress={displayProgress}
        playing={playing}
        speed={speed}
        onPlayToggle={() => {
          if (progressRef.current >= 3) progressRef.current = 0
          setPlaying(!playing)
        }}
        onProgressChange={t => {
          progressRef.current = t
          setDisplayProgress(t)
        }}
        onSpeedChange={setSpeed}
      />
      <div style={{ flex: 1, position: 'relative', minHeight: 300 }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>
      <SVDInfo rank={svd2.rank} sigmas={[svd2.Sigma.x, svd2.Sigma.y]} />
    </div>
  )
}

function SVD3D() {
  const { matrix33, svdResult } = useMatrix()
  const svd3 = svdResult as any
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [displayProgress, setDisplayProgress] = useState(0)
  const progressRef = useRef(0)
  const playingRef = useRef(playing)
  const speedRef = useRef(speed)
  playingRef.current = playing
  speedRef.current = speed
  const rendererRef = useRef<Scene3DRenderer | null>(null)
  const uiTickRef = useRef(0)

  const { containerRef } = useThreeScene((threeScene, _camera, dt) => {
    // Update progress when playing (merged into render loop — single rAF)
    if (playingRef.current) {
      progressRef.current += dt * speedRef.current
      if (progressRef.current >= 3) {
        progressRef.current = 3
        setPlaying(false)
      }
      uiTickRef.current++
      if (uiTickRef.current % 2 === 0) {
        setDisplayProgress(progressRef.current)
      }
    }

    if (!rendererRef.current) {
      rendererRef.current = new Scene3DRenderer(threeScene)
    }
    const effectiveMatrix = computeTransform3D(svd3, progressRef.current)
    rendererRef.current.render(effectiveMatrix, dt)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <TimelineController
        progress={displayProgress}
        playing={playing}
        speed={speed}
        onPlayToggle={() => {
          if (progressRef.current >= 3) progressRef.current = 0
          setPlaying(!playing)
        }}
        onProgressChange={t => {
          progressRef.current = t
          setDisplayProgress(t)
        }}
        onSpeedChange={setSpeed}
      />
      <div ref={containerRef} className="three-container" style={{ flex: 1, minHeight: 350 }} />
      <SVDInfo rank={svd3.rank} sigmas={[svd3.Sigma.x, svd3.Sigma.y, svd3.Sigma.z]} />
    </div>
  )
}

function SVDInfo({ rank, sigmas }: { rank: number; sigmas: number[] }) {
  const maxDim = sigmas.length
  return (
    <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
      <span>奇异值：</span>
      {sigmas.map((s, i) => (
        <span key={i} style={{ color: s < 0.01 ? 'var(--coral)' : 'var(--ink)', marginLeft: 8, fontFamily: "'JetBrains Mono', 'Consolas', monospace", fontSize: '13px' }}>
          σ{i + 1} = {s.toFixed(3)}
        </span>
      ))}
      <span style={{ marginLeft: 16 }}>
        秩 = <span style={{ color: rank < maxDim ? 'var(--coral)' : 'var(--ink)', fontWeight: 500 }}>{rank}</span>
      </span>
      {rank < maxDim && (
        <span style={{ color: 'var(--coral)', marginLeft: 8, fontSize: '13px' }}>
          （非满秩 — 存在维度坍缩）
        </span>
      )}
    </div>
  )
}

export function SVDDeconstructorPanel() {
  const { dimension } = useMatrix()

  if (dimension === 2) return <SVD2D />
  return <SVD3D />
}
