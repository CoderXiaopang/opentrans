import React, { useState } from 'react'
import useStore from '../stores/useStore'

export default function Toolbar() {
  const { srcDir, setSrcDir, translatorDir, setTranslatorDir, setFileTree, settings, openSettings, progressMap, theme, toggleTheme } = useStore()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [resumed, setResumed] = useState(false)

  const translatingCount = Object.values(progressMap).filter(s => s === 'translating').length

  async function handleSelectProject() {
    const dir = await window.electronAPI.selectDirectory()
    if (!dir) return
    setSrcDir(dir)
    setLoading(true)
    setStatus('正在初始化...')
    const result = await window.electronAPI.cloneProject(dir)
    if (!result.success) { setStatus('初始化失败: ' + result.error); setLoading(false); return }
    setTranslatorDir(result.translatorDir)
    setResumed(!!result.resumed)
    const treeResult = await window.electronAPI.getFileTree(dir, result.translatorDir)
    if (treeResult.success) setFileTree(treeResult.tree)
    setStatus(result.resumed ? '已恢复上次进度' : '项目已初始化')
    setLoading(false)
  }

  async function handleBatchTranslate() {
    if (!srcDir || !translatorDir) return
    setStatus('加入翻译队列...')
    await window.electronAPI.startBatchTranslate(srcDir, translatorDir, settings)
    setStatus('全部任务已入队')
  }

  async function handleRefresh() {
    if (!srcDir || !translatorDir) return
    const treeResult = await window.electronAPI.getFileTree(srcDir, translatorDir)
    if (treeResult.success) setFileTree(treeResult.tree)
    setStatus('已刷新')
  }

  const isDark = theme === 'dark'

  const hdrBtn = (extra = {}) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 6, border: 'none',
    fontSize: 13, cursor: 'pointer', fontWeight: 500,
    transition: 'all .2s', WebkitAppRegion: 'no-drag',
    ...extra,
  })

  const ghostBtn = {
    width: 36, height: 36, borderRadius: '50%',
    border: '1px solid var(--border)', background: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all .2s', WebkitAppRegion: 'no-drag',
    flexShrink: 0,
  }

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 16px 0 90px', gap: 10, flexShrink: 0,
      background: 'var(--toolbar-bg)',
      borderBottom: '1px solid var(--border)',
      position: 'relative', overflow: 'hidden',
      WebkitAppRegion: 'drag',
    }}>
      {/* bg glow */}
      <div style={{ position: 'absolute', top: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 6, WebkitAppRegion: 'no-drag' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
          <i className="fa fa-language" style={{ color: '#fff', fontSize: 16 }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg,#3B82F6,#60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          OpenTrans
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, WebkitAppRegion: 'no-drag' }}>
        <button style={hdrBtn({ background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff', opacity: loading ? 0.6 : 1 })}
          onClick={loading ? undefined : handleSelectProject}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <i className="fa fa-folder-open" />
          <span>{loading ? '加载中…' : srcDir ? '切换项目' : '选择项目'}</span>
        </button>

        {srcDir && <>
          <button style={hdrBtn({ background: 'var(--bg-mid)', color: 'var(--text-secondary)', border: '1px solid var(--border-solid)' })}
            onClick={handleRefresh}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-mid)' }}
          >
            <i className="fa fa-refresh" /><span>刷新项目</span>
          </button>

          <button style={hdrBtn({ background: 'var(--bg-mid)', color: 'var(--text-secondary)', border: '1px solid var(--border-solid)' })}
            onClick={handleBatchTranslate}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-mid)' }}
          >
            <i className="fa fa-play-circle" /><span>全量翻译</span>
          </button>
        </>}
      </div>

      <div style={{ flex: 1 }} />

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, WebkitAppRegion: 'no-drag' }}>
        {translatingCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-mid)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
            <i className="fa fa-spinner fa-spin" style={{ color: '#F59E0B' }} />
            <span>翻译中: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{translatingCount}</span> 个文件</span>
          </div>
        )}

        {status && !translatingCount && (
          <span style={{ fontSize: 12, color: 'var(--text-subtle)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {resumed && <span style={{ color: '#10B981', marginRight: 4 }}>●</span>}
            {status}
          </span>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={ghostBtn}
          title={isDark ? '切换白天模式' : '切换夜间模式'}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-mid)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <i className={`fa ${isDark ? 'fa-sun-o' : 'fa-moon-o'}`} style={{ color: isDark ? '#FCD34D' : '#6366F1', fontSize: 15 }} />
        </button>

        {/* Settings */}
        <button
          onClick={openSettings}
          style={ghostBtn}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-mid)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <i className="fa fa-cog" style={{ color: 'var(--text-muted)', fontSize: 15 }} />
        </button>
      </div>
    </header>
  )
}
