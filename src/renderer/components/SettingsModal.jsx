import React, { useState } from 'react'
import useStore from '../stores/useStore'

export default function SettingsModal() {
  const { settings, setSettings, closeSettings, profiles, saveProfile, applyProfile, deleteProfile } = useStore()
  const [form, setForm] = useState({ ...settings })
  const [profileName, setProfileName] = useState('')
  const [tab, setTab] = useState('config') // 'config' | 'profiles'
  const [saveMsg, setSaveMsg] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'concurrency' ? parseInt(value, 10) || 1 : value
    }))
  }

  function handleSave() {
    setSettings(form)
    closeSettings()
  }

  function handleSaveProfile() {
    const name = profileName.trim()
    if (!name) return
    saveProfile(name)
    setProfileName('')
    setSaveMsg(`已保存「${name}」`)
    setTimeout(() => setSaveMsg(''), 2000)
  }

  function handleApplyProfile(name) {
    applyProfile(name)
    const profile = profiles.find(p => p.name === name)
    if (profile) {
      const { name: _, ...s } = profile
      setForm(s)
    }
    setTab('config')
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--input-bg)', border: '1px solid var(--border-solid)',
    borderRadius: 8, fontSize: 13, color: 'var(--text-primary)',
    outline: 'none', transition: 'border-color .15s, box-shadow .15s',
  }

  const labelStyle = {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4,
  }

  const tabStyle = (active) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
    border: 'none', cursor: 'pointer', transition: 'all .15s',
    background: active ? 'var(--bg-mid)' : 'none',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    borderBottom: active ? '2px solid #3B82F6' : '2px solid transparent',
  })

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) closeSettings() }}
    >
      <div style={{ background: 'var(--modal-bg)', borderRadius: 14, width: '90%', maxWidth: 460, border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 0', paddingBottom: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa fa-cog" style={{ color: '#3B82F6', fontSize: 13 }} />
            </div>
            翻译设置
          </h3>
          <button onClick={closeSettings} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <i className="fa fa-times" style={{ color: 'var(--text-muted)', fontSize: 14 }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: '10px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <button style={tabStyle(tab === 'config')} onClick={() => setTab('config')}>
            <i className="fa fa-sliders" style={{ marginRight: 5 }} />当前配置
          </button>
          <button style={tabStyle(tab === 'profiles')} onClick={() => setTab('profiles')}>
            <i className="fa fa-bookmark-o" style={{ marginRight: 5 }} />配置档案
            {profiles.length > 0 && (
              <span style={{ marginLeft: 5, background: '#3B82F6', color: '#fff', borderRadius: 99, fontSize: 10, padding: '1px 6px' }}>{profiles.length}</span>
            )}
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {/* Config tab */}
          {tab === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { name: 'baseUrl', label: 'API 基础地址', icon: 'fa-link',   type: 'text',     placeholder: 'https://api.openai.com/v1' },
                { name: 'apiKey',  label: 'API Key',      icon: 'fa-key',    type: 'password',  placeholder: 'sk-xxxxxxxxxxxxxxxx' },
                { name: 'model',   label: '模型名称',      icon: 'fa-server', type: 'text',     placeholder: 'gpt-4o-mini' },
              ].map(({ name, label, icon, type, placeholder }) => (
                <div key={name}>
                  <label style={labelStyle}>
                    <i className={`fa ${icon}`} style={{ color: 'rgba(59,130,246,0.7)' }} />{label}
                  </label>
                  <input name={name} type={type} value={form[name]} onChange={handleChange}
                    placeholder={placeholder} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)' }}
                    onBlur={e =>  { e.target.style.borderColor = 'var(--border-solid)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>
                  <i className="fa fa-tasks" style={{ color: 'rgba(59,130,246,0.7)' }} />默认并发数
                </label>
                <select name="concurrency" value={form.concurrency} onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)' }}
                  onBlur={e =>  { e.target.style.borderColor = 'var(--border-solid)'; e.target.style.boxShadow = 'none' }}
                >
                  {[1, 2, 3, 5, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Save as profile */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                <input
                  value={profileName} onChange={e => setProfileName(e.target.value)}
                  placeholder="将当前配置另存为档案…"
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)' }}
                  onBlur={e =>  { e.target.style.borderColor = 'var(--border-solid)'; e.target.style.boxShadow = 'none' }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                />
                <button onClick={handleSaveProfile} style={{ padding: '9px 14px', background: 'var(--bg-mid)', border: '1px solid var(--border-solid)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <i className="fa fa-bookmark-o" style={{ marginRight: 4 }} />保存档案
                </button>
              </div>
              {saveMsg && <p style={{ margin: 0, fontSize: 12, color: '#10B981' }}>{saveMsg}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button onClick={closeSettings}
                  style={{ padding: '9px 18px', background: 'var(--bg-mid)', border: '1px solid var(--border-solid)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-mid)'}
                >取消</button>
                <button onClick={handleSave}
                  style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#3B82F6,#2563EB)', border: 'none', borderRadius: 8, fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >保存并应用</button>
              </div>
            </div>
          )}

          {/* Profiles tab */}
          {tab === 'profiles' && (
            <div>
              {profiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-subtle)' }}>
                  <i className="fa fa-bookmark-o" style={{ fontSize: 32, marginBottom: 10, display: 'block', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>还没有保存的配置档案</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12 }}>在「当前配置」页填好后另存为档案</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {profiles.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-mid)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.model} · {p.baseUrl}
                        </div>
                      </div>
                      <button onClick={() => handleApplyProfile(p.name)} style={{ padding: '5px 12px', background: 'linear-gradient(135deg,#3B82F6,#2563EB)', border: 'none', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        应用
                      </button>
                      <button onClick={() => deleteProfile(p.name)} style={{ width: 28, height: 28, background: 'none', border: '1px solid var(--border-solid)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = '#EF4444' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border-solid)' }}
                      >
                        <i className="fa fa-trash-o" style={{ color: '#EF4444', fontSize: 12 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
