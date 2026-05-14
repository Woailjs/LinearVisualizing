import { useRef, useEffect, useState } from 'react'
import { useMatrix } from '../../store/MatrixContext'
import { useCanvas2D } from '../../hooks/useCanvas2D'
import { useThreeScene } from '../../hooks/useThreeScene'
import { renderCanvas2D } from './Canvas2DRenderer'
import { Scene3DRenderer } from './Scene3DRenderer'
import { CompositionTimeline } from './CompositionTimeline'
import { identity22, identity33, multiply22, multiply33, isIdentity22, isIdentity33, lerpMatrix22, lerpMatrix33 } from '../../math/matrix'
import { easeInOutCubic } from '../../utils/easing'

const ZOOM_FACTOR = 1.4

function SpaceTransform2D() {
  const { matrix22, matrixB22 } = useMatrix()
  const bIsIdentity = isIdentity22(matrixB22)

  if (bIsIdentity) {
    return <SpaceTransform2DBasic />
  }
  return <SpaceTransform2DComposed />
}

function SpaceTransform2DBasic() {
  const { matrix22 } = useMatrix()
  const zoomRef = useRef(1)

  const canvasRef = useCanvas2D((ctx, w, h, _dt) => {
    renderCanvas2D(ctx, w, h, matrix22, zoomRef.current)
  })

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR
      zoomRef.current = Math.max(0.1, Math.min(10, zoomRef.current * factor))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div style={{ flex: 1, position: 'relative', minHeight: 400 }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

function SpaceTransform2DComposed() {
  const { matrix22, matrixB22 } = useMatrix()
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
    if (playingRef.current) {
      progressRef.current += dt * speedRef.current
      if (progressRef.current >= 1) {
        progressRef.current = 1
        setPlaying(false)
      }
      uiTickRef.current++
      if (uiTickRef.current % 2 === 0) {
        setDisplayProgress(progressRef.current)
      }
    }

    const t = easeInOutCubic(Math.min(progressRef.current, 1))
    const effectiveMatrix = multiply22(
      lerpMatrix22(identity22(), matrixB22, t),
      matrix22,
    )
    // Dashed arrows show A's basis vectors, solid arrows show current effective transform
    renderCanvas2D(ctx, w, h, effectiveMatrix, zoomRef.current, matrix22)
  })

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR
      zoomRef.current = Math.max(0.1, Math.min(10, zoomRef.current * factor))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <CompositionTimeline
        progress={displayProgress}
        playing={playing}
        speed={speed}
        onPlayToggle={() => {
          if (progressRef.current >= 1) progressRef.current = 0
          setPlaying(!playing)
        }}
        onProgressChange={t => {
          progressRef.current = t
          setDisplayProgress(t)
        }}
        onSpeedChange={setSpeed}
      />
      <div style={{ flex: 1, position: 'relative', minHeight: 350 }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}

function SpaceTransform3D() {
  const { matrix33, matrixB33 } = useMatrix()
  const bIsIdentity = isIdentity33(matrixB33)

  if (bIsIdentity) {
    return <SpaceTransform3DBasic />
  }
  return <SpaceTransform3DComposed />
}

function SpaceTransform3DBasic() {
  const { matrix33 } = useMatrix()
  const rendererRef = useRef<Scene3DRenderer | null>(null)

  const { containerRef } = useThreeScene((threeScene, _camera, dt) => {
    if (!rendererRef.current) {
      rendererRef.current = new Scene3DRenderer(threeScene)
    }
    rendererRef.current.render(matrix33, dt)
  })

  return <div ref={containerRef} className="three-container" style={{ width: '100%', flex: 1, minHeight: 400 }} />
}

function SpaceTransform3DComposed() {
  const { matrix33, matrixB33 } = useMatrix()
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
    if (playingRef.current) {
      progressRef.current += dt * speedRef.current
      if (progressRef.current >= 1) {
        progressRef.current = 1
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
    const t = easeInOutCubic(Math.min(progressRef.current, 1))
    const effectiveMatrix = multiply33(
      lerpMatrix33(identity33(), matrixB33, t),
      matrix33,
    )
    // Dashed arrows show A's basis vectors, solid arrows show current effective transform
    rendererRef.current.render(effectiveMatrix, dt, matrix33)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <CompositionTimeline
        progress={displayProgress}
        playing={playing}
        speed={speed}
        onPlayToggle={() => {
          if (progressRef.current >= 1) progressRef.current = 0
          setPlaying(!playing)
        }}
        onProgressChange={t => {
          progressRef.current = t
          setDisplayProgress(t)
        }}
        onSpeedChange={setSpeed}
      />
      <div ref={containerRef} className="three-container" style={{ flex: 1, minHeight: 350 }} />
    </div>
  )
}

export function SpaceTransformPanel() {
  const { dimension } = useMatrix()

  if (dimension === 2) {
    return <SpaceTransform2D />
  }
  return <SpaceTransform3D />
}
