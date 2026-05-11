import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react'
import type { Mat2x2, Mat3x3, EigenResult2, EigenResult3, SVDResult2, SVDResult3 } from '../math/types'
import { identity22, identity33 } from '../math/matrix'
import { eigen22, eigen33 } from '../math/eigen'
import { svd22, svd33 } from '../math/svd'

export type Dimension = 2 | 3

interface MatrixState {
  dimension: Dimension
  matrix22: Mat2x2
  matrix33: Mat3x3
  setDimension: (d: Dimension) => void
  setMatrix22: (m: Mat2x2) => void
  setMatrix33: (m: Mat3x3) => void
  eigenResult: EigenResult2 | EigenResult3
  svdResult: SVDResult2 | SVDResult3
}

const MatrixContext = createContext<MatrixState | null>(null)

export function MatrixProvider({ children }: { children: ReactNode }) {
  const [dimension, setDimension] = useState<Dimension>(2)
  const [matrix22, setMatrix22] = useState<Mat2x2>(identity22())
  const [matrix33, setMatrix33] = useState<Mat3x3>(identity33())

  const eigenResult = useMemo(() => {
    if (dimension === 2) return eigen22(matrix22)
    return eigen33(matrix33)
  }, [dimension, matrix22, matrix33])

  const svdResult = useMemo(() => {
    if (dimension === 2) return svd22(matrix22)
    return svd33(matrix33)
  }, [dimension, matrix22, matrix33])

  const value: MatrixState = {
    dimension,
    matrix22,
    matrix33,
    setDimension,
    setMatrix22,
    setMatrix33,
    eigenResult,
    svdResult,
  }

  return (
    <MatrixContext.Provider value={value}>
      {children}
    </MatrixContext.Provider>
  )
}

export function useMatrix(): MatrixState {
  const ctx = useContext(MatrixContext)
  if (!ctx) throw new Error('useMatrix must be used within MatrixProvider')
  return ctx
}
