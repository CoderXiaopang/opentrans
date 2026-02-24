import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import MarkdownIt from 'markdown-it'
import useStore from '../stores/useStore'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

const EditorPanel = forwardRef(function EditorPanel({ onScroll }, ref) {
  const { selectedFile, translatorDir, progressMap, updateProgress } = useStore()
  const [content, setContent] = useState('')
  const [html, setHtml] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const containerRef = useRef(null)
  const isSyncingRef = useRef(false)
  const lastFileRef = useRef(null)

  useImperativeHandle(ref, () => ({
    _syncScroll(ratio) {
      isSyncingRef.current = true
      const el = containerRef.current
      if (el) el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
      setTimeout(() => { isSyncingRef.current = false }, 100)
    }
  }))

  useEffect(() => {
    if (!selectedFile) { setContent(''); setHtml(''); return }
    const relPath = selectedFile.relPath
    const status = progressMap[relPath]
    if (lastFileRef.current !== relPath || status === 'translated') {
      lastFileRef.current = relPath
      setEditMode(false)
      window.electronAPI.getFileContent(selectedFile.destPath).then(res => {
        const text = (res.success && res.content) ? res.content : ''
        setContent(text)
        setHtml(text ? md.render(text) : '')
      })
    }
  }, [selectedFile, progressMap])

  function handleScroll() {
    if (isSyncingRef.current || !onScroll || !containerRef.current) return
    const el = containerRef.current
    onScroll(el.scrollTop / (el.scrollHeight - el.clientHeight || 1))
  }

  async function handleSave() {
    if (!selectedFile || !translatorDir) return
    setSaving(true)
    const result = await window.electronAPI.saveTranslation(
      selectedFile.destPath, content, selectedFile.srcPath, translatorDir
    )
    setSaving(false)
    if (result.success) {
      updateProgress(selectedFile.relPath, 'translated')
      setEditMode(false)
      setHtml(md.render(content))
    }
  }

  const status = selectedFile && progressMap[selectedFile.relPath]
  const isTranslating = status === 'translating'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)' }}>
      {/* Header */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'var(--bg-panel)' }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="fa fa-pencil" style={{ color: '#3B82F6', fontSize: 11 }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedFile ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedFile ? `译文 (${selectedFile.relPath})` : '译文'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isTranslating && (
            <span style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="fa fa-spinner fa-spin" />翻译中…
            </span>
          )}
          {saving && (
            <span style={{ fontSize: 11, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="fa fa-spinner fa-spin" />保存中…
            </span>
          )}
          {!isTranslating && !saving && content && (
            <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="fa fa-check-circle" />已自动保存
            </span>
          )}
          {!editMode && content && !isTranslating && (
            <button onClick={() => setEditMode(true)} style={{ background: 'var(--bg-mid)', border: '1px solid var(--border-solid)', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <i className="fa fa-edit" style={{ marginRight: 4 }} />编辑
            </button>
          )}
          {editMode && (
            <button onClick={handleSave} style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', border: 'none', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              <i className="fa fa-save" style={{ marginRight: 4 }} />保存
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={containerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: editMode ? 16 : 24 }}>
        {!selectedFile && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
            <i className="fa fa-language" style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 13 }}>译文将在此处显示</p>
          </div>
        )}

        {selectedFile && isTranslating && !content && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, color: 'var(--text-subtle)', gap: 14 }}>
            <i className="fa fa-spinner fa-spin" style={{ fontSize: 28, color: '#3B82F6' }} />
            <p style={{ margin: 0, fontSize: 13 }}>正在调用翻译 API，请稍候…</p>
          </div>
        )}

        {selectedFile && editMode ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onBlur={handleSave}
            autoFocus
            style={{
              width: '100%', minHeight: 'calc(100vh - 100px)',
              background: 'var(--textarea-bg)', color: 'var(--text-primary)',
              border: '1px solid var(--border-solid)', borderRadius: 10,
              padding: 16, fontSize: 12.5, lineHeight: 1.75,
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              resize: 'none', outline: 'none',
              boxShadow: '0 0 0 2px rgba(59,130,246,0.2)',
            }}
          />
        ) : selectedFile && content ? (
          <div
            style={{ maxWidth: 720, margin: '0 auto', background: 'var(--bg-card)', borderRadius: 12, padding: '24px 28px', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', cursor: 'text', transition: 'box-shadow .2s' }}
            onDoubleClick={() => setEditMode(true)}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--card-glow)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--card-shadow)'}
          >
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : null}
      </div>
    </div>
  )
})

export default EditorPanel
