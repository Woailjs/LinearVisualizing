import { useEffect, useRef } from 'react'

export function useAnimationFrame(
  callback: (dt: number, time: number) => void,
  active: boolean = true,
) {
  const rafRef = useRef<number>(0)
  const callbackRef = useRef(callback)
  const prevTimeRef = useRef<number | undefined>(undefined)
  callbackRef.current = callback

  useEffect(() => {
    if (!active) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      prevTimeRef.current = undefined
      return
    }

    const loop = (timestamp: number) => {
      if (prevTimeRef.current === undefined) {
        prevTimeRef.current = timestamp
      }
      const dt = Math.min((timestamp - prevTimeRef.current) / 1000, 0.1)
      prevTimeRef.current = timestamp
      callbackRef.current(dt, timestamp)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])
}
