'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { RiCheckFill, RiUploadCloud2Fill, RiDeleteBinFill, RiAlertFill, RiFileTextFill, RiStoreFill } from 'react-icons/ri'
import {
  saveIssuerProfile,
  saveAlertThreshold,
  saveOrderTextTemplate,
  type AppSettings,
} from '@/app/admin/(protected)/settings/actions'

/* ── 共通 ── */

function SectionCard({ icon: Icon, title, description, children }: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-dark)' }}
          >
            <Icon size={15} style={{ color: 'var(--text-invert)' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-5">
        {children}
      </div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {hint && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving || saved}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
      style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
    >
      <RiCheckFill size={14} />
      {saved ? '保存しました' : saving ? '保存中...' : '保存する'}
    </button>
  )
}

const fieldStyle = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
} as const

/* ── 発注書情報 ── */

function IssuerSection({ settings }: { settings: AppSettings }) {
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [name,    setName]    = useState(settings.name    ?? '')
  const [phone,   setPhone]   = useState(settings.phone   ?? '')
  const [email,   setEmail]   = useState(settings.email   ?? '')
  const [address, setAddress] = useState(settings.address ?? '')

  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url)
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [removeLogo,  setRemoveLogo]  = useState(false)
  const [dragging,    setDragging]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function applyFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setLogoFile(file)
    setRemoveLogo(false)
    const reader = new FileReader()
    reader.onload = e => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) applyFile(file)
  }, [])

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const fd = new FormData()
      fd.append('name', name); fd.append('phone', phone)
      fd.append('email', email); fd.append('address', address)
      if (logoFile)   fd.append('logo', logoFile)
      if (removeLogo) fd.append('remove_logo', '1')
      const result = await saveIssuerProfile(fd)
      if (result.error) { setError(result.error) } else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard icon={RiStoreFill} title="発注書情報" description="発注書に印刷される会社情報・ロゴ">
      <div className="space-y-4 max-w-lg">
        {/* ロゴ */}
        <Field label="会社ロゴ">
          {logoPreview ? (
            <div className="flex items-center gap-3">
              <div
                className="relative w-28 h-16 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
              >
                <Image src={logoPreview} alt="logo" fill className="object-contain p-2" unoptimized={logoPreview.startsWith('data:')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  変更
                </button>
                <button type="button" onClick={() => { setLogoPreview(null); setLogoFile(null); setRemoveLogo(true); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: '#d84f2a', border: '1px solid #d84f2a44' }}>
                  <RiDeleteBinFill size={11} /> 削除
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer transition-all"
              style={{ background: dragging ? 'var(--bg-dark)' : 'var(--bg-base)', border: `2px dashed ${dragging ? 'var(--text-secondary)' : 'var(--border)'}`, color: dragging ? 'var(--text-invert)' : 'var(--text-muted)' }}
            >
              <RiUploadCloud2Fill size={22} />
              <p className="text-xs font-medium">クリックまたはドラッグ＆ドロップ</p>
              <p className="text-xs opacity-60">PNG / JPG / SVG</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f) }} />
        </Field>

        <Field label="会社名">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例：株式会社〇〇"
            className="w-full px-3 py-2.5 text-sm outline-none rounded-xl" style={fieldStyle} />
        </Field>
        <Field label="電話番号">
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="例：011-000-0000"
            className="w-full px-3 py-2.5 text-sm outline-none rounded-xl" style={fieldStyle} />
        </Field>
        <Field label="メールアドレス">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="例：info@example.com"
            className="w-full px-3 py-2.5 text-sm outline-none rounded-xl" style={fieldStyle} />
        </Field>
        <Field label="住所">
          <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="例：〒060-0001 北海道札幌市..." rows={3}
            className="w-full px-3 py-2.5 text-sm outline-none rounded-xl resize-none" style={fieldStyle} />
        </Field>

        {error && <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>}
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </SectionCard>
  )
}

/* ── アラート設定 ── */

function AlertSection({ settings }: { settings: AppSettings }) {
  const [threshold, setThreshold] = useState(String(settings.alert_threshold))
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    const val = parseFloat(threshold)
    if (isNaN(val) || val <= 0 || val > 100) { setError('1〜100の数値を入力してください'); return }
    setSaving(true); setError(null); setSaved(false)
    try {
      const result = await saveAlertThreshold(val)
      if (result.error) { setError(result.error) } else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard icon={RiAlertFill} title="アラート設定" description="価格上昇がしきい値を超えた際に価格アラートを記録します">
      <div className="space-y-4 max-w-sm">
        <Field label="アラートしきい値" hint="この割合以上価格が上昇した場合にアラートを発生させます">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 h-11 rounded-xl flex-1"
              style={fieldStyle}
            >
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="w-full text-base tabular-nums outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>% 以上</span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            現在: <span className="font-semibold">{settings.alert_threshold}%</span> 以上でアラート
          </p>
        </Field>

        {error && <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>}
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </SectionCard>
  )
}

/* ── 発注テキスト雛形 ── */

function OrderTemplateSection({ settings }: { settings: AppSettings }) {
  const [template, setTemplate] = useState(settings.order_text_template)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const result = await saveOrderTextTemplate(template)
      if (result.error) { setError(result.error) } else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard icon={RiFileTextFill} title="発注テキスト雛形" description="発注時のテキスト生成に使用される雛形">
      <div className="space-y-4 max-w-lg">
        <Field
          label="テキスト雛形"
          hint="{{items}} = 注文品目一覧、{{delivery}} = 納品希望日に置き換えられます"
        >
          <textarea
            value={template}
            onChange={e => setTemplate(e.target.value)}
            rows={10}
            className="w-full px-3 py-3 text-sm outline-none resize-y rounded-xl font-mono"
            style={fieldStyle}
          />
        </Field>

        {error && <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>}

        <div className="flex items-center gap-3 flex-wrap">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
          <button
            onClick={() => setTemplate(`お世話になっております。
下記の通り発注をお願いいたします。

【注文内容】
{{items}}

{{delivery}}`)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            デフォルトに戻す
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

/* ── メイン ── */

export function SettingsClient({ settings }: { settings: AppSettings }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <IssuerSection    settings={settings} />
      <AlertSection     settings={settings} />
      <OrderTemplateSection settings={settings} />
    </div>
  )
}
