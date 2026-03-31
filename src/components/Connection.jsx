import { useEffect, useMemo, useRef, useState } from 'react'
import { Line } from '@react-three/drei'
import { animate, remove } from 'animejs'

const lerp = (a, b, t) => a + (b - a) * t

function Connection({ start, end, active }) {
  const progressRef = useRef({ value: active ? 1 : 0 })
  const [progress, setProgress] = useState(active ? 1 : 0)

  useEffect(() => {
    remove(progressRef.current)
    animate(progressRef.current, {
      value: active ? 1 : 0,
      duration: active ? 380 : 150,
      ease: active ? 'outQuad' : 'linear',
      update: () => setProgress(progressRef.current.value),
    })

    return () => remove(progressRef.current)
  }, [active])

  const points = useMemo(() => {
    const t = progress
    const x = lerp(start[0], end[0], t)
    const y = lerp(start[1], end[1], t)
    const z = lerp(start[2], end[2], t)
    return [start, [x, y, z]]
  }, [start, end, progress])

  if (!active && progress <= 0.01) {
    return null
  }

  return <Line points={points} color="#00f6ff" lineWidth={2.5} transparent opacity={0.95} />
}

export default Connection

