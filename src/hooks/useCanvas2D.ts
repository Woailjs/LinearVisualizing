import { useRef, useEffect, useCallback } from 'react'

export function useCanvas2D(
  render: (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => void,
  active: boolean = true,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderRef = useRef(render)
  renderRef.current = render
  const rafRef = useRef<number>(0)
  const prevTimeRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!active) return

    let lastW = 0
    let lastH = 0

    const loop = (timestamp: number) => {
      if (prevTimeRef.current === undefined) prevTimeRef.current = timestamp
      const dt = Math.min((timestamp - prevTimeRef.current) / 1000, 0.1)
      prevTimeRef.current = timestamp

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)

      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Only resize canvas bitmap when CSS size actually changes
      if (w !== lastW || h !== lastH) {
        lastW = w
        lastH = h
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      renderRef.current(ctx, w, h, dt)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  return canvasRef
}
