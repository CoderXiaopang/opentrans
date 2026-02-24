import React, { useEffect, useRef } from 'react'
import useStore from './stores/useStore'
import Toolbar from './components/Toolbar'
import FileTree from './components/FileTree'
import MarkdownPanel from './components/MarkdownPanel'
import EditorPanel from './components/EditorPanel'
import SettingsModal from './components/SettingsModal'

export default function App() {
  const { settingsOpen, updateProgress, theme } = useStore()
  const cleanupRef = useRef(null)
  const markdownPanelRef = useRef(null)
  const editorPanelRef = useRef(null)

  // Apply saved theme on first render
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    if (window.electronAPI) {
      cleanupRef.current = window.electronAPI.onTranslationProgress((data) => {
        updateProgress(data.relPath, data.status)
      })
    }
    return () => { if (cleanupRef.current) cleanupRef.current() }
  }, [updateProgress])

  function handleMarkdownScroll(ratio) {
    const el = editorPanelRef.current
    if (el && el._syncScroll) el._syncScroll(ratio)
  }
  function handleEditorScroll(ratio) {
    const el = markdownPanelRef.current
    if (el && el._syncScroll) el._syncScroll(ratio)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Toolbar />
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* subtle center glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)',
          transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 0,
        }} />

        <aside style={{ width: '20%', minWidth: 200, background: 'var(--file-tree-bg)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 1, overflowY: 'auto' }}>
          <FileTree />
        </aside>

        <div style={{ width: '40%', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
          <MarkdownPanel ref={markdownPanelRef} onScroll={handleMarkdownScroll} />
        </div>

        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
          <EditorPanel ref={editorPanelRef} onScroll={handleEditorScroll} />
        </div>
      </main>

      {settingsOpen && <SettingsModal />}
    </div>
  )
}
