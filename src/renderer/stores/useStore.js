import { create } from 'zustand'

const STORAGE_KEY = 'opentrans_settings'
const THEME_KEY   = 'opentrans_theme'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

const useStore = create((set, get) => ({
  // Project paths
  srcDir: null,
  translatorDir: null,

  // File tree
  fileTree: [],

  // Selected file
  selectedFile: null,

  // Translation progress map: relPath -> status
  progressMap: {},

  // Settings / API config
  settings: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    concurrency: 3,
    ...loadSettings()
  },

  settingsOpen: false,

  // Theme
  theme: loadTheme(),

  // Actions
  setSrcDir: (dir) => set({ srcDir: dir }),
  setTranslatorDir: (dir) => set({ translatorDir: dir }),
  setFileTree: (tree) => set({ fileTree: tree }),
  setSelectedFile: (file) => set({ selectedFile: file }),

  updateProgress: (relPath, status) =>
    set((state) => ({
      progressMap: { ...state.progressMap, [relPath]: status },
      fileTree: updateTreeStatus(state.fileTree, relPath, status)
    })),

  setSettings: (settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    set({ settings })
  },

  openSettings:  () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    return { theme: next }
  }),
}))

function updateTreeStatus(tree, relPath, status) {
  return tree.map((node) => {
    if (node.type === 'file' && node.relPath === relPath) {
      return { ...node, status }
    }
    if (node.type === 'dir' && node.children) {
      return { ...node, children: updateTreeStatus(node.children, relPath, status) }
    }
    return node
  })
}

export default useStore
