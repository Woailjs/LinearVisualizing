import type { Mat2x2, Vec2 } from '../../math/types'
import { apply22 } from '../../math/matrix'
import { drawArrow, type Line2 } from '../../utils/geometry'

const GRID_RANGE = 5
const DASH_SEG = [6, 4]

// Pre-generated static grid lines
const staticGridLines: Line2[] = []
for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
  staticGridLines.push({ start: { x: i, y: -GRID_RANGE }, end: { x: i, y: GRID_RANGE } })
  staticGridLines.push({ start: { x: -GRID_RANGE, y: i }, end: { x: GRID_RANGE, y: i } })
}

export function renderCanvas2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  matrix: Mat2x2,
  zoom: number = 1,
  referenceMatrix?: Mat2x2,
) {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2

  // Compute suitable scale to fit both original and transformed grids
  let maxCoord = GRID_RANGE
  for (const line of staticGridLines) {
    const t1 = apply22(matrix, line.start)
    const t2 = apply22(matrix, line.end)
    maxCoord = Math.max(maxCoord, Math.abs(t1.x), Math.abs(t1.y), Math.abs(t2.x), Math.abs(t2.y))
  }
  // Also check basis vectors
  const ti = apply22(matrix, { x: 1, y: 0 })
  const tj = apply22(matrix, { x: 0, y: 1 })
  maxCoord = Math.max(maxCoord, Math.abs(ti.x), Math.abs(ti.y), Math.abs(tj.x), Math.abs(tj.y))

  const margin = 1.2
  const scale = (Math.min(w, h) / 2 / (maxCoord * margin)) * zoom

  function toCanvas(v: Vec2): [number, number] {
    return [cx + v.x * scale, cy - v.y * scale]
  }

  // ---- Draw reference grid (dashed) ----
  ctx.strokeStyle = 'rgba(100, 100, 150, 0.35)'
  ctx.lineWidth = 0.8
  ctx.setLineDash(DASH_SEG)
  for (const line of staticGridLines) {
    const [x1, y1] = toCanvas(line.start)
    const [x2, y2] = toCanvas(line.end)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // ---- Draw axes ----
  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(200, 200, 220, 0.6)'
  ctx.lineWidth = 1.2
  const [axLeft] = toCanvas({ x: -maxCoord * margin, y: 0 })
  const [axRight] = toCanvas({ x: maxCoord * margin, y: 0 })
  const [, ayBottom] = toCanvas({ x: 0, y: -maxCoord * margin })
  const [, ayTop] = toCanvas({ x: 0, y: maxCoord * margin })
  ctx.beginPath(); ctx.moveTo(axLeft, cy); ctx.lineTo(axRight, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, ayBottom); ctx.lineTo(cx, ayTop); ctx.stroke()

  // ---- Draw reference basis vectors (dashed) — only in composition mode ----
  const [oriX, oriY] = toCanvas({ x: 0, y: 0 })
  if (referenceMatrix) {
    ctx.lineWidth = 2
    ctx.setLineDash(DASH_SEG)
    const refI = apply22(referenceMatrix, { x: 1, y: 0 })
    const refJ = apply22(referenceMatrix, { x: 0, y: 1 })
    const [riX, riY] = toCanvas(refI)
    const [rjX, rjY] = toCanvas(refJ)
    ctx.strokeStyle = 'rgba(255,100,100,0.5)'
    drawArrow(ctx, oriX, oriY, riX, riY, 7)
    ctx.strokeStyle = 'rgba(100,255,100,0.5)'
    drawArrow(ctx, oriX, oriY, rjX, rjY, 7)
  }

  // ---- Draw transformed grid (solid) ----
  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)'
  ctx.lineWidth = 1
  for (const line of staticGridLines) {
    const t1 = apply22(matrix, line.start)
    const t2 = apply22(matrix, line.end)
    const [x1, y1] = toCanvas(t1)
    const [x2, y2] = toCanvas(t2)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // ---- Draw transformed basis vectors (solid) ----
  const iHatDisplay = apply22(matrix, { x: 1, y: 0 })
  const jHatDisplay = apply22(matrix, { x: 0, y: 1 })
  ctx.setLineDash([])
  ctx.lineWidth = 2.5
  const [tix, tiy] = toCanvas(iHatDisplay)
  const [tjx, tjy] = toCanvas(jHatDisplay)
  ctx.strokeStyle = '#ff4444'
  drawArrow(ctx, oriX, oriY, tix, tiy, 9)
  ctx.strokeStyle = '#44ff44'
  drawArrow(ctx, oriX, oriY, tjx, tjy, 9)

  // ---- Labels ----
  ctx.fillStyle = '#ff6666'
  ctx.font = '13px monospace'
  ctx.fillText('î', tix + 6, tiy - 6)
  ctx.fillStyle = '#66ff66'
  ctx.fillText('ĵ', tjx + 6, tjy - 6)
}
