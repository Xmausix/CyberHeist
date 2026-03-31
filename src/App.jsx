import Scene from './components/Scene'
import NetworkMap from './ui/NetworkMap'
import TerminalUI from './ui/TerminalUI'
import { useGameStore } from './store/useGameStore'

function App() {
  const phase = useGameStore((state) => state.phase)

  return (
    <div className="app">
      <Scene />
      <TerminalUI />
      {phase === 'level-select' && <NetworkMap />}
    </div>
  )
}

export default App

