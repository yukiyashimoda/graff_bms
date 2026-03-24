import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

type TxRow = {
  id:              string
  type:            'in' | 'out' | 'adjustment'
  quantity:        number
  cost_price:      number | null
  notes:           string | null
  created_at:      string
  product_name:    string
  product_name_en: string
  unit:            string
}

const TYPE_LABEL = { in: '入庫', out: '出庫', adjustment: '調整' } as const

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function dayKey(iso: string) { return iso.slice(0, 10) }
function formatDayHeader(iso: string) {
  const d = new Date(iso)
  const days = ['日','月','火','水','木','金','土']
  return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, padding: 36, color: '#1a1a1a' },
  title:       { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle:    { fontSize: 9, color: '#888', marginBottom: 20 },
  summaryRow:  { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 6, padding: 10 },
  summaryLabel:{ fontSize: 8, color: '#888', marginBottom: 3 },
  summaryVal:  { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  dayHeader:   { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f5f4f2',
                 paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, marginTop: 12, marginBottom: 2 },
  dayLabel:    { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  dayMeta:     { fontSize: 8, color: '#888' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e5e5',
                 paddingBottom: 4, marginBottom: 2 },
  thText:      { fontSize: 7, color: '#aaa', fontFamily: 'Helvetica-Bold' },
  row:         { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  cell:        { fontSize: 8, color: '#333' },
  badge:       { borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  footer:      { marginTop: 24, borderTopWidth: 1, borderColor: '#e5e5e5', paddingTop: 8,
                 flexDirection: 'row', justifyContent: 'space-between' },
  footerText:  { fontSize: 7, color: '#aaa' },
})

const COL = { date: 60, type: 30, name: 160, qty: 40, unit_price: 60, total: 60, notes: 80 }

export function StockHistoryDocument({
  transactions,
  month,
}: {
  transactions: TxRow[]
  month: string   // "YYYY-MM"
}) {
  const [y, m] = month.split('-')
  const title = `${y}年${Number(m)}月 入出庫履歴`

  const inCount  = transactions.filter(t => t.type === 'in').length
  const outCount = transactions.filter(t => t.type === 'out').length
  const adjCount = transactions.filter(t => t.type === 'adjustment').length
  const inCost   = transactions
    .filter(t => t.type === 'in' && t.cost_price != null)
    .reduce((s, t) => s + (t.cost_price ?? 0) * t.quantity, 0)

  // 日別グループ
  const byDay = new Map<string, TxRow[]>()
  transactions.forEach(t => {
    const dk = dayKey(t.created_at)
    if (!byDay.has(dk)) byDay.set(dk, [])
    byDay.get(dk)!.push(t)
  })
  const days = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <Document title={title}>
      <Page size="A4" style={s.page}>
        {/* タイトル */}
        <Text style={s.title}>入出庫履歴</Text>
        <Text style={s.subtitle}>{title}　　出力日: {new Date().toLocaleDateString('ja-JP')}</Text>

        {/* サマリー */}
        <View style={s.summaryRow}>
          {[
            { label: '入庫',       value: `${inCount} 件` },
            { label: '出庫',       value: `${outCount} 件` },
            { label: '調整',       value: `${adjCount} 件` },
            { label: '仕入れ総額', value: inCost > 0 ? `¥${inCost.toLocaleString()}` : '—' },
          ].map(item => (
            <View key={item.label} style={s.summaryCard}>
              <Text style={s.summaryLabel}>{item.label}</Text>
              <Text style={s.summaryVal}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* テーブルヘッダー */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, { width: COL.date }]}>日時</Text>
          <Text style={[s.thText, { width: COL.type }]}>種別</Text>
          <Text style={[s.thText, { flex: 1 }]}>商品名</Text>
          <Text style={[s.thText, { width: COL.qty, textAlign: 'right' }]}>数量</Text>
          <Text style={[s.thText, { width: COL.unit_price, textAlign: 'right' }]}>単価</Text>
          <Text style={[s.thText, { width: COL.total, textAlign: 'right' }]}>合計</Text>
          <Text style={[s.thText, { width: COL.notes }]}>メモ</Text>
        </View>

        {/* 日別データ */}
        {days.map(([dk, txs]) => {
          const dayCost = txs
            .filter(t => t.type === 'in' && t.cost_price != null)
            .reduce((acc, t) => acc + (t.cost_price ?? 0) * t.quantity, 0)

          return (
            <View key={dk}>
              <View style={s.dayHeader}>
                <Text style={s.dayLabel}>{formatDayHeader(txs[0].created_at)}</Text>
                <Text style={s.dayMeta}>
                  {txs.length}件{dayCost > 0 ? `　仕入 ¥${dayCost.toLocaleString()}` : ''}
                </Text>
              </View>

              {txs.map(t => (
                <View key={t.id} style={s.row}>
                  <Text style={[s.cell, { width: COL.date, color: '#888' }]}>
                    {formatDate(t.created_at)}
                  </Text>
                  <Text style={[s.cell, { width: COL.type,
                    color: t.type === 'in' ? '#16a34a' : t.type === 'out' ? '#dc2626' : '#888' }]}>
                    {TYPE_LABEL[t.type]}
                  </Text>
                  <Text style={[s.cell, { flex: 1 }]}>
                    {t.product_name}
                    {t.product_name_en ? `  ${t.product_name_en}` : ''}
                  </Text>
                  <Text style={[s.cell, { width: COL.qty, textAlign: 'right',
                    color: t.type === 'in' ? '#16a34a' : t.type === 'out' ? '#dc2626' : '#555' }]}>
                    {t.type === 'in' ? '+' : t.type === 'out' ? '−' : ''}{t.quantity} {t.unit}
                  </Text>
                  <Text style={[s.cell, { width: COL.unit_price, textAlign: 'right', color: '#888' }]}>
                    {t.type === 'in' && t.cost_price != null ? `¥${t.cost_price.toLocaleString()}` : ''}
                  </Text>
                  <Text style={[s.cell, { width: COL.total, textAlign: 'right' }]}>
                    {t.type === 'in' && t.cost_price != null
                      ? `¥${(t.cost_price * t.quantity).toLocaleString()}`
                      : ''}
                  </Text>
                  <Text style={[s.cell, { width: COL.notes, color: '#888' }]}>
                    {t.notes ?? ''}
                  </Text>
                </View>
              ))}
            </View>
          )
        })}

        {/* フッター */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>graff.bms — 入出庫履歴</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
