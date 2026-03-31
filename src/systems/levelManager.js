import { levels } from '../data/levels'

const mergeLevels = (extraLevels = []) => [...levels, ...extraLevels]

export const getLevelById = (id, extraLevels = []) => mergeLevels(extraLevels).find((level) => level.id === id) || levels[0]

export const getLevelMeta = (extraLevels = []) =>
  mergeLevels(extraLevels).map((level) => ({
    id: level.id,
    codeName: level.codeName,
    difficulty: level.difficulty,
    totalNodes: level.nodes.length,
  }))

export const getNextLevelId = (id, extraLevels = []) => {
  const allLevels = mergeLevels(extraLevels)
  const currentIndex = allLevels.findIndex((level) => level.id === id)
  if (currentIndex === -1 || currentIndex === allLevels.length - 1) {
    return null
  }
  return allLevels[currentIndex + 1].id
}

