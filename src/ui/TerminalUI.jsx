import { useEffect, useMemo, useRef, useState } from 'react'
import { animate } from 'animejs'
import { useGameStore } from '../store/useGameStore'

const errorMessages = {
  'invalid-node': 'Invalid operation.',
  'node-reused': 'Node already used in this chain.',
  'connection-blocked': 'Connection denied by firewall.',
  'line-intersection': 'Signal collision: lines cannot cross.',
}

const formatTime = (ms) => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
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
  const summary = useGameStore((state) => state.scoreSummary)

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
      {summary && <p>Grade {summary.grade} · Score {summary.score} · Time {summary.seconds}s</p>}
      <div className="success-actions">
        <button onClick={nextLevel}>NEXT LEVEL</button>
        <button onClick={goToLevelSelect}>LEVEL SELECT</button>
      </div>
    </div>
  )
}

function SettingsPanel() {
  const settings = useGameStore((state) => state.settings)
  const updateSetting = useGameStore((state) => state.updateSetting)

  return (
    <div className="settings-panel hud-panel">
      <h3>SETTINGS</h3>
      <label>
        <input type="checkbox" checked={settings.hintsEnabled} onChange={(event) => updateSetting('hintsEnabled', event.target.checked)} />
        Hints enabled
      </label>
      <label>
        <input type="checkbox" checked={settings.audioEnabled} onChange={(event) => updateSetting('audioEnabled', event.target.checked)} />
        Audio enabled
      </label>
      <label>
        <input type="checkbox" checked={settings.showTutorial} onChange={(event) => updateSetting('showTutorial', event.target.checked)} />
        Show tutorial text
      </label>
    </div>
  )
}

function HUD() {
  const level = useGameStore((state) => state.level)
  const progress = useGameStore((state) => state.progress)
  const retryLevel = useGameStore((state) => state.retryLevel)
  const undoMove = useGameStore((state) => state.undoMove)
  const goToLevelSelect = useGameStore((state) => state.goToLevelSelect)
  const lastError = useGameStore((state) => state.lastError)
  const elapsedMs = useGameStore((state) => state.elapsedMs)
  const errorCount = useGameStore((state) => state.errorCount)
  const requestHint = useGameStore((state) => state.requestHint)
  const phase = useGameStore((state) => state.phase)
  const tickTimer = useGameStore((state) => state.tickTimer)
  const settings = useGameStore((state) => state.settings)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (phase !== 'puzzle') return undefined
    tickTimer()
    const timer = setInterval(() => tickTimer(), 250)
    return () => clearInterval(timer)
  }, [phase, tickTimer])

  const resolvedError = useMemo(() => {
    if (!lastError) return null
    return errorMessages[lastError] || lastError
  }, [lastError])

  return (
    <div className="hud-layout">
      <section className="hud-panel panel-info">
        <h1>CYBER HEIST</h1>
        <p>{level.codeName}</p>
        {settings.showTutorial && <p className="tutorial-text">{level.tutorial}</p>}
      </section>

      <section className="hud-panel panel-progress">
        <span>PROGRESS {progress}%</span>
        <div className="bar">
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="stats-row">
          <span>TIME {formatTime(elapsedMs)}</span>
          <span>ERRORS {errorCount}</span>
        </div>
      </section>

      <section className="hud-panel panel-actions">
        <button onClick={undoMove}>UNDO</button>
        <button onClick={retryLevel}>RESTART</button>
        <button onClick={requestHint} disabled={!settings.hintsEnabled}>HINT</button>
        <button onClick={goToLevelSelect}>LEVELS</button>
        <button onClick={() => setShowSettings((value) => !value)}>SETTINGS</button>
      </section>

      {showSettings && <SettingsPanel />}
      {resolvedError && <section className="hud-panel panel-error">{resolvedError}</section>}
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
