import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import MarkdownIt from 'markdown-it'
import useStore from '../stores/useStore'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

const MarkdownPanel = forwardRef(function MarkdownPanel({ onScroll }, ref) {
  const { selectedFile } = useStore()
  const [html, setHtml] = useState('')
  const containerRef = useRef(null)
  const isSyncingRef = useRef(false)

  useImperativeHandle(ref, () => ({
    _syncScroll(ratio) {
      isSyncingRef.current = true
      const el = containerRef.current
      if (el) el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
      setTimeout(() => { isSyncingRef.current = false }, 100)
    }
  }))

  useEffect(() => {
    if (!selectedFile) { setHtml(''); return }
    window.electronAPI.getFileContent(selectedFile.srcPath).then(res => {
      setHtml(res.success ? md.render(res.content) : '')
    })
  }, [selectedFile])

  function handleScroll() {
    if (isSyncingRef.current || !onScroll || !containerRef.current) return
    const el = containerRef.current
    onScroll(el.scrollTop / (el.scrollHeight - el.clientHeight || 1))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)' }}>
      {/* Header */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'var(--bg-panel)' }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="fa fa-file-text-o" style={{ color: 'var(--text-muted)', fontSize: 11 }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedFile ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedFile ? `原文 (${selectedFile.relPath})` : '原文'}
        </span>
      </div>

      {/* Content */}
      <div ref={containerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {selectedFile ? (
          <div style={{ maxWidth: 720, margin: '0 auto', background: 'var(--bg-card)', borderRadius: 12, padding: '24px 28px', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
            <i className="fa fa-file-text-o" style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 13 }}>从左侧选择一个 Markdown 文件</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default MarkdownPanel
