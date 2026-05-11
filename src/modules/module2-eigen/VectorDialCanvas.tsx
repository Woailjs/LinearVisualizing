import { useRef, useCallback, useState } from 'react'
import { useCanvas2D } from '../../hooks/useCanvas2D'
import type { Mat2x2, Vec2 } from '../../math/types'
import { apply22 } from '../../math/matrix'
import { drawArrow } from '../../utils/geometry'
import { checkSnap, type SnapState } from './EigenSnapDetector'
import { useMatrix } from '../../store/MatrixContext'
import type { EigenResult2 } from '../../math/types'

const SNAP_THRESHOLD_DEG = 5
const DIAL_RADIUS_RATIO = 0.32

export function VectorDialCanvas() {
  const { matrix22, eigenResult } = useMatrix()
  const eigen2 = eigenResult as EigenResult2
  const angleRef = useRef(0)
  const [snapState, setSnapState] = useState<SnapState | null>(null)
  const isDragging = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dx = e.clientX - rect.left - cx
    const dy = e.clientY - rect.top - cy
    const r = Math.min(rect.width, rect.height) * DIAL_RADIUS_RATIO
    if (dx * dx + dy * dy <= r * r * 1.3) {
      isDragging.current = true
      canvas.setPointerCapture(e.pointerId)
      // Immediately position pointer at click location
      const rawAngle = Math.atan2(cy - (e.clientY - rect.top), e.clientX - rect.left - cx)
      angleRef.current = rawAngle
    }
  }, [])

  const updateAngle = useCallback(
    (clientX: number, clientY: number, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      const rawAngle = Math.atan2(cy - (clientY - rect.top), clientX - rect.left - cx)

      const evs = eigen2.vectors
      const evVals = eigen2.values
        .filter(v => Math.abs(v.imag) < 1e-12)
        .map(v => v.real)

      const snap = checkSnap(rawAngle, evs, evVals, SNAP_THRESHOLD_DEG)
      angleRef.current = snap.angle
      setSnapState(snap)
    },
    [eigen2],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return
      updateAngle(e.clientX, e.clientY, e.currentTarget)
    },
    [updateAngle],
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const canvasRef = useCanvas2D((ctx, w, h, _dt) => {
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) * DIAL_RADIUS_RATIO

    ctx.clearRect(0, 0, w, h)

    const snapped = snapState?.snapped ?? false
    const angle = angleRef.current
    const inputVec: Vec2 = { x: Math.cos(angle), y: Math.sin(angle) }
    const outputVec = apply22(matrix22, inputVec)

    // Scale output vector to fit within dial
    const outLen = Math.sqrt(outputVec.x * outputVec.x + outputVec.y * outputVec.y)
    const displayScale = outLen > 0.01 ? r / Math.max(outLen, 0.01) : r

    // ---- Dial circle ----
    ctx.strokeStyle = snapped ? 'rgba(255, 215, 0, 0.6)' : 'rgba(150, 150, 180, 0.4)'
    ctx.lineWidth = snapped ? 2.5 : 1.5
    if (snapped) {
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 15
    }
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    // ---- Tick marks ----
    ctx.fillStyle = 'rgba(200,200,220,0.5)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    const labels = ['0°', '90°', '180°', '270°']
    for (let i = 0; i < 4; i++) {
      const a = (-i * Math.PI) / 2 + Math.PI / 2 // rotate so 0° is right
      const lx = cx + (r + 18) * Math.cos(a)
      const ly = cy - (r + 18) * Math.sin(a)
      ctx.fillText(labels[i], lx, ly + 4)
      // Tick
      const tx1 = cx + (r - 6) * Math.cos(a)
      const ty1 = cy - (r - 6) * Math.sin(a)
      const tx2 = cx + r * Math.cos(a)
      const ty2 = cy - r * Math.sin(a)
      ctx.strokeStyle = 'rgba(200,200,220,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke()
    }

    // ---- Input vector (blue) ----
    const inX = cx + r * inputVec.x
    const inY = cy - r * inputVec.y
    ctx.lineWidth = 2.5
    ctx.strokeStyle = snapped ? '#ffd700' : '#4488ff'
    if (snapped) {
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 10
    }
    drawArrow(ctx, cx, cy, inX, inY, 10)
    ctx.shadowBlur = 0
    ctx.fillStyle = snapped ? '#ffd700' : '#88aaff'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('v', inX + 6, inY - 6)

    // ---- Output vector (orange) ----
    const outX = cx + outputVec.x * displayScale * 0.85
    const outY = cy - outputVec.y * displayScale * 0.85
    ctx.lineWidth = 2.5
    ctx.strokeStyle = snapped ? '#ffd700' : '#ff8844'
    if (snapped) {
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 10
    }
    drawArrow(ctx, cx, cy, outX, outY, 10)
    ctx.shadowBlur = 0
    ctx.fillStyle = snapped ? '#ffd700' : '#ffaa66'
    ctx.fillText('Av', outX + 6, outY - 6)

    // ---- Snap indicator ----
    if (snapped && snapState) {
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `特征向量! λ = ${snapState.eigenvalue?.toFixed(2)}`,
        cx,
        cy - r - 20,
      )
    }

    // ---- Complex eigenvalue warning ----
    if (!eigen2.allReal) {
      ctx.fillStyle = '#ff6666'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⚠ 复特征值 — 无实特征向量', cx, cy + r + 30)
    }
  })

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
