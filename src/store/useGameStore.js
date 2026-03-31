import { create } from 'zustand'
import { getLevelById, getLevelMeta, getNextLevelId } from '../systems/levelManager'
import { generateProceduralLevel } from '../systems/proceduralLevels'
import {
  buildLevelIndex,
  canConnectNodes,
  getHintNode,
  getProgressPercent,
  getScoreSummary,
  hasWonLevel,
} from '../systems/puzzleLogic'

const STORAGE_KEY = 'cyberheist-progress-v2'

const loadPersistedData = () => {
  if (typeof window === 'undefined') {
    return { unlockedLevelIds: [1], bestResults: {} }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { unlockedLevelIds: [1], bestResults: {} }
    const parsed = JSON.parse(raw)
    return {
      unlockedLevelIds: Array.isArray(parsed.unlockedLevelIds) && parsed.unlockedLevelIds.length
        ? parsed.unlockedLevelIds
        : [1],
      bestResults: parsed.bestResults || {},
    }
  } catch {
    return { unlockedLevelIds: [1], bestResults: {} }
  }
}

const createAudioEngine = () => {
  if (typeof window === 'undefined') return null
  const AudioContextRef = window.AudioContext || window.webkitAudioContext
  if (!AudioContextRef) return null

  const ctx = new AudioContextRef()
  let ambientOsc = null
  let ambientGain = null

  const beep = (frequency, duration = 0.08, type = 'square', volume = 0.05) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  return {
    resume: () => (ctx.state === 'suspended' ? ctx.resume() : Promise.resolve()),
    click: () => beep(740, 0.07, 'triangle', 0.035),
    error: () => {
      beep(160, 0.14, 'sawtooth', 0.04)
      setTimeout(() => beep(120, 0.11, 'sawtooth', 0.03), 35)
    },
    success: () => {
      beep(600, 0.08, 'triangle', 0.04)
      setTimeout(() => beep(900, 0.12, 'triangle', 0.04), 90)
      setTimeout(() => beep(1240, 0.14, 'triangle', 0.035), 180)
    },
    startAmbient: () => {
      if (ambientOsc) return
      ambientOsc = ctx.createOscillator()
      ambientGain = ctx.createGain()
      ambientOsc.type = 'sine'
      ambientOsc.frequency.value = 54
      ambientGain.gain.value = 0.015
      ambientOsc.connect(ambientGain)
      ambientGain.connect(ctx.destination)
      ambientOsc.start()
    },
    stopAmbient: () => {
      if (!ambientOsc) return
      ambientOsc.stop()
      ambientOsc.disconnect()
      ambientGain?.disconnect()
      ambientOsc = null
      ambientGain = null
    },
  }
}

const persisted = loadPersistedData()
const staticLevel1 = getLevelById(1)

const defaultSettings = {
  hintsEnabled: true,
  audioEnabled: true,
  showTutorial: true,
}

const persistProgress = (state) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      unlockedLevelIds: state.unlockedLevelIds,
      bestResults: state.bestResults,
    }),
  )
}

const resetStateForLevel = (level) => ({
  phase: 'puzzle',
  level,
  levelIndex: buildLevelIndex(level),
  pathNodes: [],
  pathEdges: [],
  selectedNode: null,
  isDragging: false,
  lastError: null,
  progress: 0,
  errorCount: 0,
  levelStartAt: Date.now(),
  elapsedMs: 0,
  hintNodeId: null,
  moveHistory: [],
  scoreSummary: null,
})

export const useGameStore = create((set, get) => ({
  phase: 'boot',
  level: staticLevel1,
  levelIndex: buildLevelIndex(staticLevel1),
  pathNodes: [],
  pathEdges: [],
  selectedNode: null,
  isDragging: false,
  lastError: null,
  progress: 0,
  errorCount: 0,
  levelStartAt: null,
  elapsedMs: 0,
  hintNodeId: null,
  moveHistory: [],
  scoreSummary: null,
  bootMessages: ['> INITIALIZING SYSTEM...', '> CONNECTING...', '> ACCESS TERMINAL'],
  unlockedLevelIds: persisted.unlockedLevelIds,
  bestResults: persisted.bestResults,
  proceduralLevels: [],
  nextProceduralId: 100,
  audio: null,
  settings: defaultSettings,
  eventLog: [],

  getAvailableLevels: () => getLevelMeta(get().proceduralLevels),

  logEvent: (type, payload = {}) => {
    set((state) => ({ eventLog: [...state.eventLog.slice(-79), { type, payload, at: Date.now() }] }))
  },

  initAudio: async () => {
    const state = get()
    if (!state.settings.audioEnabled) return

    if (state.audio) {
      await state.audio.resume()
      state.audio.startAmbient()
      return
    }

    const engine = createAudioEngine()
    if (!engine) return
    await engine.resume()
    engine.startAmbient()
    set({ audio: engine })
  },

  updateSetting: (key, value) => {
    set((state) => ({ settings: { ...state.settings, [key]: value } }))
    const state = get()
    if (key === 'audioEnabled') {
      state.audio?.resume()
      if (value) state.audio?.startAmbient()
      else state.audio?.stopAmbient()
    }
  },

  finishBoot: () => set({ phase: 'level-select' }),

  selectLevel: (levelId) => {
    const state = get()
    const level = getLevelById(levelId, state.proceduralLevels)
    set(resetStateForLevel(level))
    state.logEvent('onLevelStart', { levelId })
  },

  createProceduralLevel: () => {
    const state = get()
    const id = state.nextProceduralId
    const generated = generateProceduralLevel({ id, nodeCount: 7 + ((id - 100) % 3) })
    if (!generated) {
      state.logEvent('onError', { reason: 'procedural-generation-failed', id })
      return
    }

    set((current) => ({
      proceduralLevels: [...current.proceduralLevels, generated],
      nextProceduralId: current.nextProceduralId + 1,
      unlockedLevelIds: Array.from(new Set([...current.unlockedLevelIds, id])),
    }))
    state.logEvent('onProceduralLevelGenerated', { levelId: id })
  },

  tickTimer: () => {
    const state = get()
    if (state.phase !== 'puzzle' || !state.levelStartAt) return
    set({ elapsedMs: Date.now() - state.levelStartAt })
  },

  requestHint: () => {
    const state = get()
    if (!state.settings.hintsEnabled || state.phase !== 'puzzle') return
    set({ hintNodeId: getHintNode(state.level, state.pathNodes) })
  },

  clearHint: () => set({ hintNodeId: null }),

  pointerDownNode: async (nodeId) => {
    await get().initAudio()
    const state = get()
    state.audio?.click()
    state.logEvent('onNodeClick', { nodeId })

    if (!state.pathNodes.length) {
      set({
        pathNodes: [nodeId],
        selectedNode: nodeId,
        isDragging: true,
        progress: getProgressPercent([nodeId], state.level.nodes.length),
        hintNodeId: null,
      })
      return
    }

    if (state.selectedNode !== nodeId) {
      set({ lastError: 'Start drag from currently active node.', isDragging: false })
      state.audio?.error()
      return
    }

    set({ isDragging: true })
  },

  pointerUpNode: async (targetNodeId) => {
    await get().initAudio()
    const state = get()
    if (!state.isDragging || !state.selectedNode) return

    const from = state.selectedNode
    const to = targetNodeId
    const target = state.level.nodes.find((node) => node.id === to)

    if (target?.type === 'locked' && target.unlockBy && !state.pathNodes.includes(target.unlockBy)) {
      set({
        isDragging: false,
        errorCount: state.errorCount + 1,
        lastError: `Node ${to} is locked. Unlock node ${target.unlockBy} first.`,
      })
      state.audio?.error()
      return
    }

    const legal = canConnectNodes({
      from,
      to,
      levelIndex: state.levelIndex,
      pathEdges: state.pathEdges,
      pathNodes: state.pathNodes,
    })

    if (!legal.ok) {
      const shouldReset = target?.type === 'corrupted'
      if (shouldReset) {
        set({ ...resetStateForLevel(state.level), errorCount: state.errorCount + 1, lastError: 'Corrupted node triggered reset.' })
      } else {
        set({ isDragging: false, lastError: legal.reason, errorCount: state.errorCount + 1 })
      }

      state.audio?.error()
      state.logEvent('onError', { reason: legal.reason, to, from })
      return
    }

    const nextNodes = [...state.pathNodes, to]
    const nextEdges = [...state.pathEdges, [from, to]]

    set({
      pathNodes: nextNodes,
      pathEdges: nextEdges,
      selectedNode: to,
      isDragging: false,
      progress: getProgressPercent(nextNodes, state.level.nodes.length),
      lastError: null,
      hintNodeId: null,
      moveHistory: [...state.moveHistory, { pathNodes: state.pathNodes, pathEdges: state.pathEdges, selectedNode: state.selectedNode }],
    })

    state.audio?.click()

    if (hasWonLevel(nextNodes, state.level.nodes.length)) {
      const elapsedMs = Date.now() - state.levelStartAt
      const summary = getScoreSummary({ elapsedMs, errors: state.errorCount, level: state.level })
      const next = getNextLevelId(state.level.id, state.proceduralLevels)

      set((current) => {
        const unlockedLevelIds = next ? Array.from(new Set([...current.unlockedLevelIds, next])) : current.unlockedLevelIds
        const prevBest = current.bestResults[current.level.id]
        const bestResults = !prevBest || summary.score > prevBest.score
          ? { ...current.bestResults, [current.level.id]: summary }
          : current.bestResults

        const finalState = { phase: 'success', elapsedMs, scoreSummary: summary, unlockedLevelIds, bestResults }
        queueMicrotask(() => persistProgress({ ...current, ...finalState }))
        return finalState
      })

      state.audio?.success()
      state.logEvent('onLevelComplete', { levelId: state.level.id, summary })
    }
  },

  cancelDrag: () => set({ isDragging: false }),

  undoMove: () => {
    const state = get()
    if (state.phase !== 'puzzle' || !state.moveHistory.length) return

    const last = state.moveHistory[state.moveHistory.length - 1]
    set({
      pathNodes: last.pathNodes,
      pathEdges: last.pathEdges,
      selectedNode: last.selectedNode,
      moveHistory: state.moveHistory.slice(0, -1),
      progress: getProgressPercent(last.pathNodes, state.level.nodes.length),
      lastError: null,
      hintNodeId: null,
    })
  },

  retryLevel: () => {
    const level = get().level
    set({ ...resetStateForLevel(level), phase: 'puzzle' })
    get().logEvent('onRestart', { levelId: level.id })
  },

  goToLevelSelect: () => set({ phase: 'level-select', selectedNode: null, isDragging: false, hintNodeId: null }),

  nextLevel: () => {
    const state = get()
    const next = getNextLevelId(state.level.id, state.proceduralLevels)
    if (!next) {
      set({ phase: 'level-select' })
      return
    }
    state.selectLevel(next)
  },
}))
