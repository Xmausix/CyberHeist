import { getLevelMeta } from '../systems/levelManager'
import { useGameStore } from '../store/useGameStore'

function LevelSelect() {
  const unlocked = useGameStore((state) => state.unlockedLevelIds)
  const selectLevel = useGameStore((state) => state.selectLevel)
  const levels = getLevelMeta()

  return (
    <div className="overlay">
      <h2>SELECT TARGET NODE GRID</h2>
      <div className="card-grid">
        {levels.map((level) => {
          const isUnlocked = unlocked.includes(level.id)
          return (
            <button
              key={level.id}
              className={`level-card ${isUnlocked ? 'ready' : 'locked'}`}
              disabled={!isUnlocked}
              onClick={() => selectLevel(level.id)}
            >
              <strong>LEVEL {level.id}</strong>
              <span>{level.codeName}</span>
              <small>{level.difficulty} · {level.totalNodes} nodes</small>
              {!isUnlocked && <em>LOCKED</em>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default LevelSelect

