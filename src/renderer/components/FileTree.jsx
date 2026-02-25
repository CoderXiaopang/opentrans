import React, { useState } from 'react'
import useStore from '../stores/useStore'

const STATUS_CONFIG = {
  translated:  { color: '#10B981', icon: 'fa-check',        label: '已翻译' },
  pending:     { color: '#6B7280', icon: 'fa-clock-o',      label: '待翻译' },
  updated:     { color: '#3B82F6', icon: 'fa-refresh',      label: '需更新' },
  translating: { color: '#F59E0B', icon: 'fa-spinner',      label: '翻译中', spin: true },
  error:       { color: '#EF4444', icon: 'fa-times-circle', label: '翻译失败' },
}

function FileNode({ node, depth = 0, selectedRelPath }) {
  const { srcDir, translatorDir, setSelectedFile, settings, updateProgress } = useStore()
  const [open, setOpen] = useState(true)
  const pl = depth * 16 + 12

  if (node.type === 'dir') {
    return (
      <div>
        <button onClick={() => setOpen(o => !o)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
          paddingLeft: pl, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          borderRadius: 8, transition: 'background .15s', color: 'var(--text-muted)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mid)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <i className={`fa ${open ? 'fa-folder-open' : 'fa-folder'}`} style={{ color: '#F59E0B', fontSize: 13 }} />
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
            {node.name}
          </span>
          <i className={`fa fa-chevron-${open ? 'down' : 'right'}`} style={{ fontSize: 9, opacity: 0.4 }} />
        </button>
        {open && node.children && node.children.map(child => (
          <FileNode key={child.relPath} node={child} depth={depth + 1} selectedRelPath={selectedRelPath} />
        ))}
      </div>
    )
  }

  const cfg = STATUS_CONFIG[node.status] || STATUS_CONFIG.pending
  const isSelected = node.relPath === selectedRelPath
  const isTranslating = node.status === 'translating'

  async function handleClick() {
    if (!srcDir || !translatorDir) return
    const srcPath = `${srcDir}/${node.relPath}`
    const destPath = `${translatorDir}/${node.relPath}`
    setSelectedFile({ relPath: node.relPath, srcPath, destPath })
    // 只有未翻译的才自动触发翻译
    if (node.status !== 'translated') {
      updateProgress(node.relPath, 'translating')
      await window.electronAPI.translateFile(srcPath, srcDir, translatorDir, settings)
    }
  }

  async function handleRetranslate(e) {
    e.stopPropagation()
    if (!srcDir || !translatorDir || isTranslating) return
    const srcPath = `${srcDir}/${node.relPath}`
    const destPath = `${translatorDir}/${node.relPath}`
    setSelectedFile({ relPath: node.relPath, srcPath, destPath })
    updateProgress(node.relPath, 'translating')
    await window.electronAPI.translateFile(srcPath, srcDir, translatorDir, settings)
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center',
        paddingLeft: pl, paddingRight: 6, paddingTop: 3, paddingBottom: 3,
        borderRadius: 8,
        background: isSelected ? 'rgba(16,185,129,0.1)' : 'none',
        border: isSelected ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
        transition: 'all .15s',
      }}
      onMouseEnter={e => {
        if (!isSelected) { e.currentTarget.style.background = 'var(--bg-mid)'; e.currentTarget.style.borderColor = 'var(--border)' }
        e.currentTarget.querySelector('.retranslate-btn').style.opacity = '1'
      }}
      onMouseLeave={e => {
        if (!isSelected) { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent' }
        e.currentTarget.querySelector('.retranslate-btn').style.opacity = '0'
      }}
    >
      {/* Main click area */}
      <button onClick={handleClick} title={node.relPath} style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 6,
        paddingTop: 4, paddingBottom: 4, paddingRight: 4,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0,
      }}>
        <i className="fa fa-file-text-o" style={{ color: cfg.color, fontSize: 12, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        <i className={`fa ${cfg.icon}${cfg.spin ? ' fa-spin' : ''}`} style={{ color: cfg.color, fontSize: 11, flexShrink: 0 }} />
      </button>

      {/* Retranslate button — visible on hover */}
      <button
        className="retranslate-btn"
        onClick={handleRetranslate}
        title="重新翻译"
        style={{
          width: 22, height: 22, flexShrink: 0, marginLeft: 2,
          background: 'none', border: 'none', borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isTranslating ? 'not-allowed' : 'pointer',
          opacity: 0, transition: 'opacity .15s, background .15s',
        }}
        onMouseEnter={e => { if (!isTranslating) e.currentTarget.style.background = 'rgba(59,130,246,0.15)' }}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <i className={`fa fa-repeat${isTranslating ? ' fa-spin' : ''}`} style={{ color: '#3B82F6', fontSize: 10 }} />
      </button>
    </div>
  )
}

export default function FileTree() {
  const { fileTree, srcDir, selectedFile, progressMap } = useStore()
  const selectedRelPath = selectedFile?.relPath

  const allFiles = []
  function collectFiles(nodes) {
    for (const n of nodes) {
      if (n.type === 'file') allFiles.push(n)
      else if (n.children) collectFiles(n.children)
    }
  }
  collectFiles(fileTree)
  const total = allFiles.length
  const done = allFiles.filter(f => (progressMap[f.relPath] || f.status) === 'translated').length
  const pct = total ? Math.round((done / total) * 100) : 0

  if (!srcDir) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <i className="fa fa-folder-open" style={{ color: '#3B82F6', fontSize: 20 }} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.7, margin: 0 }}>
          点击"选择项目"<br />打开含 .md 文件的目录
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <i className="fa fa-folder-open" style={{ color: 'var(--text-muted)', fontSize: 12 }} />
          项目文件
        </h2>
        <span style={{ fontSize: 11, color: 'var(--text-subtle)', background: 'var(--surface)', borderRadius: 99, padding: '1px 7px' }}>
          {total} 个文件
        </span>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {fileTree.length === 0
          ? <p style={{ fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 20 }}>未找到 Markdown 文件</p>
          : fileTree.map(node => <FileNode key={node.relPath || node.name} node={node} depth={0} selectedRelPath={selectedRelPath} />)
        }
      </div>

      {/* Progress card */}
      {total > 0 && (
        <div style={{ margin: '8px 10px 10px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 6 }}>翻译进度</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>已完成</span>
            <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>{done}/{total}</span>
          </div>
          <div style={{ height: 6, background: 'var(--progress-track)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#10B981', borderRadius: 99, transition: 'width .4s' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'translating').map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-subtle)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, display: 'inline-block' }} />
                {v.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
