import { create } from 'zustand'

const STORAGE_KEY   = 'opentrans_settings'
const PROFILES_KEY  = 'opentrans_profiles'
const THEME_KEY     = 'opentrans_theme'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

const useStore = create((set, get) => ({
  srcDir: null,
  translatorDir: null,
  fileTree: [],
  selectedFile: null,
  progressMap: {},

  settings: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    concurrency: 3,
    chunkSize: 12000,
    ...loadSettings()
  },

  // 多配置档案
  profiles: loadProfiles(),

  settingsOpen: false,
  theme: loadTheme(),

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

  // 保存当前配置为档案
  saveProfile: (name) => set((state) => {
    const profile = { name, ...state.settings }
    const existing = state.profiles.findIndex(p => p.name === name)
    const profiles = existing >= 0
      ? state.profiles.map((p, i) => i === existing ? profile : p)
      : [...state.profiles, profile]
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
    return { profiles }
  }),

  // 应用某个档案
  applyProfile: (name) => set((state) => {
    const profile = state.profiles.find(p => p.name === name)
    if (!profile) return {}
    const { name: _, ...settings } = profile
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return { settings }
  }),

  // 删除档案
  deleteProfile: (name) => set((state) => {
    const profiles = state.profiles.filter(p => p.name !== name)
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
    return { profiles }
  }),

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
    if (node.type === 'file' && node.relPath === relPath) return { ...node, status }
    if (node.type === 'dir' && node.children) return { ...node, children: updateTreeStatus(node.children, relPath, status) }
    return node
  })
}

export default useStore
