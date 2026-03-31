import { useEffect, useMemo, useRef } from 'react'
import { animate } from 'animejs'
import { useGameStore } from '../store/useGameStore'

const errorMessages = {
  'invalid-node': 'Invalid operation.',
  'node-reused': 'Node already used in this chain.',
  'connection-blocked': 'Connection denied by firewall.',
  'line-intersection': 'Signal collision: lines cannot cross.',
}

function BootScreen() {
  const bootMessages = useGameStore((state) => state.bootMessages)
  const finishBoot = useGameStore((state) => state.finishBoot)

  useEffect(() => {
    const timer = setTimeout(() => finishBoot(), 3200)
    return () => clearTimeout(timer)
  }, [finishBoot])

  return (
    <div className="overlay boot">
      {bootMessages.map((line, index) => (
        <p key={line} style={{ animationDelay: `${index * 0.7}s` }}>{line}</p>
      ))}
    </div>
  )
}

function SuccessOverlay() {
  const ref = useRef(null)
  const nextLevel = useGameStore((state) => state.nextLevel)
  const goToLevelSelect = useGameStore((state) => state.goToLevelSelect)
  const level = useGameStore((state) => state.level)

  useEffect(() => {
    if (!ref.current) return
    animate(ref.current, {
      opacity: [0, 1],
      scale: [0.96, 1],
      duration: 380,
      ease: 'outExpo',
    })
  }, [])

  return (
    <div ref={ref} className="overlay success">
      <h2>ACCESS GRANTED</h2>
      <p>{level.codeName} compromised successfully.</p>
      <div className="success-actions">
        <button onClick={nextLevel}>NEXT LEVEL</button>
        <button onClick={goToLevelSelect}>LEVEL SELECT</button>
      </div>
    </div>
  )
}

function HUD() {
  const level = useGameStore((state) => state.level)
  const progress = useGameStore((state) => state.progress)
  const retryLevel = useGameStore((state) => state.retryLevel)
  const goToLevelSelect = useGameStore((state) => state.goToLevelSelect)
  const lastError = useGameStore((state) => state.lastError)

  const resolvedError = useMemo(() => {
    if (!lastError) return null
    return errorMessages[lastError] || lastError
  }, [lastError])

  return (
    <div className="hud">
      <div>
        <h1>CYBER HEIST</h1>
        <p>{level.codeName}</p>
      </div>

      <div className="progress-box">
        <span>PROGRESS {progress}%</span>
        <div className="bar">
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="actions">
        <button onClick={retryLevel}>RETRY</button>
        <button onClick={goToLevelSelect}>LEVELS</button>
      </div>

      {resolvedError && <p className="error">{resolvedError}</p>}
    </div>
  )
}

function TerminalUI() {
  const phase = useGameStore((state) => state.phase)

  if (phase === 'boot') return <BootScreen />
  if (phase === 'success') {
    return (
      <>
        <HUD />
        <SuccessOverlay />
      </>
    )
  }

  return <HUD />
}

export default TerminalUI

