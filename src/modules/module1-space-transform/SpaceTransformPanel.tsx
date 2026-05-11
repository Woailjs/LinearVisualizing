import { useRef, useEffect } from 'react'
import { useMatrix } from '../../store/MatrixContext'
import { useCanvas2D } from '../../hooks/useCanvas2D'
import { useThreeScene } from '../../hooks/useThreeScene'
import { renderCanvas2D, startTrajectory } from './Canvas2DRenderer'
import { Scene3DRenderer } from './Scene3DRenderer'
import type { Mat2x2 } from '../../math/types'

function SpaceTransform2D() {
  const { matrix22 } = useMatrix()
  const prevMatrixRef = useRef<Mat2x2>(matrix22)
  const timeRef = useRef(0)

  useEffect(() => {
    startTrajectory(prevMatrixRef.current, matrix22, timeRef.current)
    prevMatrixRef.current = matrix22
  }, [matrix22])

  const canvasRef = useCanvas2D((ctx, w, h, dt) => {
    timeRef.current += dt
    renderCanvas2D(ctx, w, h, matrix22, timeRef.current)
  })

  return (
    <div style={{ flex: 1, position: 'relative', minHeight: 400 }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

function SpaceTransform3D() {
  const { matrix33 } = useMatrix()
  const rendererRef = useRef<Scene3DRenderer | null>(null)

  const { containerRef, scene } = useThreeScene((threeScene, _camera, dt) => {
    if (!rendererRef.current) {
      rendererRef.current = new Scene3DRenderer(threeScene)
    }
    rendererRef.current.render(matrix33, dt)
  })

  return <div ref={containerRef} className="three-container" style={{ width: '100%', flex: 1, minHeight: 400 }} />
}

export function SpaceTransformPanel() {
  const { dimension } = useMatrix()

  if (dimension === 2) {
    return <SpaceTransform2D />
  }
  return <SpaceTransform3D />
}
