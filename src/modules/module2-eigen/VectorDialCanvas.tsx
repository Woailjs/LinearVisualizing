import { useRef, useCallback, useEffect } from 'react'
import { useCanvas2D } from '../../hooks/useCanvas2D'
import type { Vec2 } from '../../math/types'
import { apply22 } from '../../math/matrix'
import { useMatrix } from '../../store/MatrixContext'
import type { EigenResult2 } from '../../math/types'

const DEFAULT_RANGE = 4
const ZOOM_FACTOR = 1.4

export function VectorDialCanvas() {
  const { matrixC22, eigenResult } = useMatrix()
  const eigen2 = eigenResult as EigenResult2
  const vecRef = useRef<Vec2>({ x: 1, y: 0 })
  const isDragging = useRef(false)
  const rangeRef = useRef(DEFAULT_RANGE)

  const toCanvas = (v: Vec2, scale: number, cx: number, cy: number) => ({
    x: cx + v.x * scale,
    y: cy - v.y * scale,
  })

  const toMath = (cxv: number, cyv: number, scale: number, cx: number, cy: number): Vec2 => ({
    x: (cxv - cx) / scale,
    y: -(cyv - cy) / scale,
  })

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const cxx = w / 2
    const cyy = h / 2
    const scale = Math.min(w, h) / (2 * rangeRef.current)

    const mx = toMath(e.clientX - rect.left, e.clientY - rect.top, scale, cxx, cyy)
    const v = vecRef.current
    if (Math.hypot(mx.x - v.x, mx.y - v.y) < 1.2) {
      isDragging.current = true
      canvas.setPointerCapture(e.pointerId)
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const cxx = w / 2
    const cyy = h / 2
    const scale = Math.min(w, h) / (2 * rangeRef.current)
    vecRef.current = toMath(e.clientX - rect.left, e.clientY - rect.top, scale, cxx, cyy)
  }, [])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const canvasRef = useCanvas2D((ctx, w, h, _dt) => {
    const cx = w / 2
    const cy = h / 2
    const r = rangeRef.current
    const scale = Math.min(w, h) / (2 * r)

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)

    // ---- Coordinate grid ----
    const rawStep = r / 5
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
    const residual = rawStep / mag
    let gridStep: number
    if (residual <= 1.5) gridStep = mag
    else if (residual <= 3.5) gridStep = 2 * mag
    else if (residual <= 7.5) gridStep = 5 * mag
    else gridStep = 10 * mag

    const gs = gridStep * scale
    ctx.strokeStyle = 'rgba(178,182,189,0.08)'
    ctx.lineWidth = 1
    for (let x = cx % gs; x < w; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = cy % gs; y < h; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    // ---- Axes ----
    ctx.strokeStyle = 'rgba(178,182,189,0.20)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()

    // ---- Tick labels ----
    ctx.fillStyle = '#656a76'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    const labelRange = Math.ceil(r / gridStep) * gridStep
    for (let val = -labelRange; val <= labelRange; val += gridStep) {
      if (val === 0) continue
      const lx = cx + val * scale
      ctx.fillText(String(val), lx, cy + 14)
    }
    ctx.textAlign = 'right'
    for (let val = -labelRange; val <= labelRange; val += gridStep) {
      if (val === 0) continue
      const ly = cy - val * scale
      ctx.fillText(String(val), cx - 6, ly + 4)
    }
    ctx.textAlign = 'right'
    ctx.fillText('0', cx - 6, cy + 14)
    ctx.textAlign = 'start'

    // ---- Draw vectors ----
    const v = vecRef.current
    const Av = apply22(matrixC22, v)

    const vEnd = toCanvas(v, scale, cx, cy)
    const avEnd = toCanvas(Av, scale, cx, cy)

    // Av first (red, behind)
    drawFilledArrow(ctx, cx, cy, avEnd.x, avEnd.y, '#e53935', 11)
    ctx.fillStyle = '#e53935'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('Av', avEnd.x + 8, avEnd.y - 6)

    // v (blue, on top)
    drawFilledArrow(ctx, cx, cy, vEnd.x, vEnd.y, '#1e88e5', 11)
    ctx.fillStyle = '#1e88e5'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('v', vEnd.x + 8, vEnd.y - 6)

    // ---- Eigenvector detection ----
    const vMag = Math.hypot(v.x, v.y)
    if (vMag > 0.1) {
      const cross = v.x * Av.y - v.y * Av.x
      const avMag = Math.hypot(Av.x, Av.y)
      const threshold = 0.05 * vMag * avMag

      if (Math.abs(cross) < threshold) {
        const dot = v.x * Av.x + v.y * Av.y
        const lambda = dot / (vMag * vMag)
        ctx.fillStyle = '#d32f2f'
        ctx.font = 'bold 15px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`特征向量！ λ ≈ ${lambda.toFixed(2)}`, cx, h - 16)
        ctx.textAlign = 'start'
      }
    }

    // Complex eigenvalue warning
    if (!eigen2.allReal) {
      ctx.fillStyle = '#e53935'
      ctx.font = '13px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('复特征值 — 无实特征向量', cx, h - 16)
      ctx.textAlign = 'start'
    }
  })

  // Non-passive wheel listener — blocks page scroll
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
      rangeRef.current = Math.max(0.5, Math.min(30, rangeRef.current * factor))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  )
}

function drawFilledArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number,
  toX: number, toY: number,
  color: string,
  headSize: number,
) {
  const dx = toX - fromX
  const dy = toY - fromY
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 0.5) return

  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.stroke()

  const ux = dx / len
  const uy = dy / len
  const angle = Math.atan2(uy, ux)
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(
    toX - headSize * Math.cos(angle - Math.PI / 6),
    toY - headSize * Math.sin(angle - Math.PI / 6),
  )
  ctx.lineTo(
    toX - headSize * Math.cos(angle + Math.PI / 6),
    toY - headSize * Math.sin(angle + Math.PI / 6),
  )
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}
