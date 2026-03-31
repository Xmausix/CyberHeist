import { levels } from '../data/levels'

export const getLevelById = (id) => levels.find((level) => level.id === id) || levels[0]

export const getLevelMeta = () =>
  levels.map((level) => ({
    id: level.id,
    codeName: level.codeName,
    difficulty: level.difficulty,
    totalNodes: level.nodes.length,
  }))

export const getNextLevelId = (id) => {
  const currentIndex = levels.findIndex((level) => level.id === id)
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return null
  }
  return levels[currentIndex + 1].id
}

