import Scene from './components/Scene'
import LevelSelect from './ui/LevelSelect'
import TerminalUI from './ui/TerminalUI'
import { useGameStore } from './store/useGameStore'

function App() {
  const phase = useGameStore((state) => state.phase)

  return (
    <div className="app">
      <Scene />
      <TerminalUI />
      {phase === 'level-select' && <LevelSelect />}
    </div>
  )
}

export default App

