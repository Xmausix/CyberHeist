import { create } from 'zustand'
import { animate } from 'animejs'
import { getLevelById, getNextLevelId } from '../systems/levelManager'
import { buildLevelIndex, canConnectNodes, getProgressPercent, hasWonLevel } from '../systems/puzzleLogic'

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
    resume: () => {
      if (ctx.state === 'suspended') {
        return ctx.resume()
      }
      return Promise.resolve()
    },
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
  }
}

const level1 = getLevelById(1)

export const useGameStore = create((set, get) => ({
  phase: 'boot',
  level: level1,
  levelIndex: buildLevelIndex(level1),
  pathNodes: [],
  pathEdges: [],
  selectedNode: null,
  isDragging: false,
  lastError: null,
  progress: 0,
  bootMessages: ['> INITIALIZING SYSTEM...', '> CONNECTING...', '> ACCESS TERMINAL'],
  unlockedLevelIds: [1],
  audio: null,
  successFlashKey: 0,

  initAudio: async () => {
    const current = get().audio
    if (current) {
      await current.resume()
      current.startAmbient()
      return
    }

    const engine = createAudioEngine()
    if (!engine) return
    await engine.resume()
    engine.startAmbient()
    set({ audio: engine })
  },

  finishBoot: () => set({ phase: 'level-select' }),

  selectLevel: (levelId) => {
    const level = getLevelById(levelId)
    set({
      phase: 'puzzle',
      level,
      levelIndex: buildLevelIndex(level),
      pathNodes: [],
      pathEdges: [],
      selectedNode: null,
      isDragging: false,
      progress: 0,
      lastError: null,
    })
  },

  pointerDownNode: async (nodeId) => {
    await get().initAudio()
    const state = get()
    state.audio?.click()

    if (!state.pathNodes.length) {
      set({ pathNodes: [nodeId], selectedNode: nodeId, isDragging: true, progress: getProgressPercent([nodeId], state.level.nodes.length) })
      return
    }

    if (state.selectedNode !== nodeId) {
      set({ lastError: 'Zacznij przeciąganie z aktywnego noda.', isDragging: false })
      state.audio?.error()
      return
    }

    set({ isDragging: true })
  },

  pointerUpNode: async (targetNodeId) => {
    await get().initAudio()
    const state = get()

    if (!state.isDragging || !state.selectedNode) {
      return
    }

    const from = state.selectedNode
    const to = targetNodeId

    const legal = canConnectNodes({
      from,
      to,
      levelIndex: state.levelIndex,
      pathEdges: state.pathEdges,
      pathNodes: state.pathNodes,
    })

    if (!legal.ok) {
      set({ isDragging: false, lastError: legal.reason })
      state.audio?.error()
      return
    }

    const nextNodes = [...state.pathNodes, to]
    const nextEdges = [...state.pathEdges, [from, to]]
    const progress = getProgressPercent(nextNodes, state.level.nodes.length)

    set({
      pathNodes: nextNodes,
      pathEdges: nextEdges,
      selectedNode: to,
      isDragging: false,
      progress,
      lastError: null,
    })

    state.audio?.click()

    if (hasWonLevel(nextNodes, state.level.nodes.length)) {
      state.audio?.success()
      set({ phase: 'success', successFlashKey: state.successFlashKey + 1 })
      animate({ v: 0 }, {
        v: 1,
        duration: 700,
        ease: 'outExpo',
      })

      const next = getNextLevelId(state.level.id)
      if (next) {
        set((current) => ({
          unlockedLevelIds: Array.from(new Set([...current.unlockedLevelIds, next])),
        }))
      }
    }
  },

  cancelDrag: () => set({ isDragging: false }),

  retryLevel: () => {
    const level = get().level
    set({
      phase: 'puzzle',
      level,
      levelIndex: buildLevelIndex(level),
      pathNodes: [],
      pathEdges: [],
      selectedNode: null,
      isDragging: false,
      lastError: null,
      progress: 0,
    })
  },

  goToLevelSelect: () => set({ phase: 'level-select', selectedNode: null, isDragging: false }),

  nextLevel: () => {
    const current = get().level.id
    const next = getNextLevelId(current)
    if (!next) {
      set({ phase: 'level-select' })
      return
    }
    get().selectLevel(next)
  },
}))

