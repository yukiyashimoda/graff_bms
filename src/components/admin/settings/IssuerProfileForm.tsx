'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  RiCheckFill,
  RiUploadCloud2Fill,
  RiDeleteBinFill,
} from 'react-icons/ri'
import { saveIssuerProfile, type IssuerProfile } from '@/app/admin/(protected)/orders/issuer-actions'

export function IssuerProfileForm({ profile }: { profile: IssuerProfile }) {
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name,    setName]    = useState(profile.name    ?? '')
  const [phone,   setPhone]   = useState(profile.phone   ?? '')
  const [email,   setEmail]   = useState(profile.email   ?? '')
  const [address, setAddress] = useState(profile.address ?? '')

  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logo_url)
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

  function handleRemoveLogo() {
    setLogoPreview(null)
    setLogoFile(null)
    setRemoveLogo(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const fd = new FormData()
      fd.append('name',    name)
      fd.append('phone',   phone)
      fd.append('email',   email)
      fd.append('address', address)
      if (logoFile)    fd.append('logo',        logoFile)
      if (removeLogo)  fd.append('remove_logo', '1')

      const result = await saveIssuerProfile(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-5 max-w-lg"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {/* ロゴ */}
      <Field label="会社ロゴ">
        {logoPreview ? (
          <div className="flex items-center gap-3">
            <div
              className="relative w-28 h-16 rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <Image
                src={logoPreview}
                alt="logo"
                fill
                className="object-contain p-2"
                unoptimized={logoPreview.startsWith('data:')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                変更
              </button>
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: '#d84f2a', border: '1px solid #d84f2a44' }}
              >
                <RiDeleteBinFill size={11} />
                削除
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
            style={{
              background: dragging ? 'var(--bg-dark)' : 'var(--bg-base)',
              border:     `2px dashed ${dragging ? 'var(--text-secondary)' : 'var(--border)'}`,
              color:      dragging ? 'var(--text-invert)' : 'var(--text-muted)',
            }}
          >
            <RiUploadCloud2Fill size={22} />
            <p className="text-xs font-medium">クリックまたはドラッグ＆ドロップ</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>PNG / JPG / SVG</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f) }}
        />
      </Field>

      {/* 会社名 */}
      <Field label="会社名">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：株式会社〇〇"
          className="w-full px-3 py-2.5 text-sm outline-none rounded-xl"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </Field>

      {/* 電話番号 */}
      <Field label="電話番号">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="例：011-000-0000"
          className="w-full px-3 py-2.5 text-sm outline-none rounded-xl"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </Field>

      {/* メールアドレス */}
      <Field label="メールアドレス">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="例：info@example.com"
          className="w-full px-3 py-2.5 text-sm outline-none rounded-xl"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </Field>

      {/* 住所 */}
      <Field label="住所">
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="例：〒060-0001 北海道札幌市中央区..."
          rows={3}
          className="w-full px-3 py-2.5 text-sm outline-none rounded-xl resize-none"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </Field>

      {error && (
        <p className="text-xs" style={{ color: '#d84f2a' }}>{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || success}
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: 'var(--bg-dark)', color: 'var(--text-invert)' }}
      >
        <RiCheckFill size={14} />
        {success ? '保存しました' : saving ? '保存中...' : '保存する'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {children}
    </div>
  )
}
