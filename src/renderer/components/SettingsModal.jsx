import React, { useState } from 'react'
import useStore from '../stores/useStore'

export default function SettingsModal() {
  const { settings, setSettings, closeSettings } = useStore()
  const [form, setForm] = useState({ ...settings })

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

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--input-bg)', border: '1px solid var(--border-solid)',
    borderRadius: 8, fontSize: 13, color: 'var(--text-primary)',
    outline: 'none', transition: 'border-color .15s, box-shadow .15s',
  }

  const labelStyle = {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6,
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) closeSettings() }}
    >
      <div style={{ background: 'var(--modal-bg)', borderRadius: 14, width: '90%', maxWidth: 440, padding: '24px 28px', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa fa-cog" style={{ color: '#3B82F6', fontSize: 15 }} />
            </div>
            翻译设置
          </h3>
          <button onClick={closeSettings} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <i className="fa fa-times" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { name: 'baseUrl',      label: 'API 基础地址', icon: 'fa-link',   type: 'text',     placeholder: 'https://api.openai.com/v1' },
            { name: 'apiKey',       label: 'API Key',      icon: 'fa-key',    type: 'password',  placeholder: 'sk-xxxxxxxxxxxxxxxx' },
            { name: 'model',        label: '模型名称',      icon: 'fa-server', type: 'text',     placeholder: 'gpt-4o-mini' },
          ].map(({ name, label, icon, type, placeholder }) => (
            <div key={name}>
              <label style={labelStyle}>
                <i className={`fa ${icon}`} style={{ color: 'rgba(59,130,246,0.7)', fontSize: 12 }} />
                {label}
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
              <i className="fa fa-tasks" style={{ color: 'rgba(59,130,246,0.7)', fontSize: 12 }} />
              默认并发数
            </label>
            <select name="concurrency" value={form.concurrency} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)' }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border-solid)'; e.target.style.boxShadow = 'none' }}
            >
              {[1, 2, 3, 5, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button onClick={closeSettings}
            style={{ padding: '9px 20px', background: 'var(--bg-mid)', border: '1px solid var(--border-solid)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-mid)'}
          >取消</button>
          <button onClick={handleSave}
            style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#3B82F6,#2563EB)', border: 'none', borderRadius: 8, fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >保存设置</button>
        </div>
      </div>
    </div>
  )
}
