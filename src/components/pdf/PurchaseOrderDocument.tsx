import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PurchaseOrderWithDetails } from '@/lib/types/database'

const s = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        10,
    paddingTop:      48,
    paddingBottom:   48,
    paddingLeft:     56,
    paddingRight:    56,
    color:           '#1e1e1c',
    backgroundColor: '#ffffff',
  },

  // ─── タイトル ─────────────────────────────────
  title: {
    fontSize:   22,
    fontFamily: 'Helvetica-Bold',
    textAlign:  'center',
    marginBottom: 24,
    letterSpacing: 4,
  },

  // ─── 日付・番号（右寄せ） ────────────────────
  metaBlock: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  metaLine: {
    fontSize:     9,
    color:        '#1e1e1c',
    marginBottom: 3,
  },

  // ─── 2カラム（発注先 ↔ 発注元） ─────────────
  twoCol: {
    flexDirection: 'row',
    marginBottom:  20,
  },
  colLeft: {
    flex: 1,
  },
  colRight: {
    width:      160,
    alignItems: 'flex-end',
  },

  supplierName: {
    fontSize:    14,
    fontFamily:  'Helvetica-Bold',
    color:       '#1e1e1c',
    marginBottom: 2,
  },
  honorific: {
    fontSize:     11,
    fontFamily:   'Helvetica-Bold',
    color:        '#1e1e1c',
  },
  supplierSub: {
    fontSize:    9,
    color:       '#555553',
    marginTop:   4,
    lineHeight:  1.6,
  },

  issuerLine: {
    fontSize:    9,
    color:       '#1e1e1c',
    marginBottom: 2,
    textAlign:  'right',
  },
  issuerName: {
    fontSize:    11,
    fontFamily:  'Helvetica-Bold',
    color:       '#1e1e1c',
    textAlign:   'right',
    marginTop:   4,
  },

  // ─── 区切り線 ────────────────────────────────
  divider: {
    borderBottom:  '1pt solid #1e1e1c',
    marginBottom:  16,
  },
  thinDivider: {
    borderBottom:  '0.5pt solid #d4d3d0',
    marginBottom:  16,
  },

  // ─── 本文一言 ────────────────────────────────
  bodyText: {
    fontSize:     10,
    marginBottom: 20,
    color:        '#1e1e1c',
  },

  // ─── 明細テーブル ─────────────────────────────
  tableHeader: {
    flexDirection:   'row',
    borderTop:       '0.5pt solid #1e1e1c',
    borderBottom:    '0.5pt solid #1e1e1c',
    paddingVertical: 5,
    marginBottom:    2,
  },
  tableHeaderText: {
    fontSize:    8,
    fontFamily:  'Helvetica-Bold',
    color:       '#1e1e1c',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection:   'row',
    paddingVertical: 6,
    borderBottom:    '0.5pt solid #d4d3d0',
  },
  cellNo:   { width: 28 },
  cellName: { flex:  1 },
  cellQty:  { width: 56, textAlign: 'right' },
  cellUnit: { width: 40, textAlign: 'center' },

  // ─── 備考欄 ──────────────────────────────────
  notesBox: {
    marginTop:       20,
    padding:         10,
    border:          '0.5pt solid #d4d3d0',
  },
  notesLabel: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  notesText: {
    fontSize:   9,
    color:      '#555553',
    lineHeight: 1.6,
  },

  // ─── フッター ────────────────────────────────
  footer: {
    position: 'absolute',
    bottom:   36,
    left:     56,
    right:    56,
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color:    '#b0b0ad',
  },
})

type Props = {
  order: PurchaseOrderWithDetails
}

export function PurchaseOrderDocument({ order }: Props) {
  const supplier = order.suppliers
  const items    = order.purchase_order_items

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* タイトル */}
        <Text style={s.title}>発注書</Text>

        {/* 日付・発注番号（右寄せ） */}
        <View style={s.metaBlock}>
          <Text style={s.metaLine}>
            発注日　{order.order_date}
          </Text>
          {order.expected_date && (
            <Text style={s.metaLine}>
              納品希望日　{order.expected_date}
            </Text>
          )}
          <Text style={s.metaLine}>
            No.　{order.id.slice(-8).toUpperCase()}
          </Text>
        </View>

        <View style={s.divider} />

        {/* 発注先 ↔ 発注元 */}
        <View style={s.twoCol}>
          {/* 左：発注先 */}
          <View style={s.colLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <Text style={s.supplierName}>{supplier.name}</Text>
              <Text style={s.honorific}> 御中</Text>
            </View>
            {(supplier.address || supplier.contact_name || supplier.phone) && (
              <View style={{ marginTop: 6 }}>
                {supplier.address     && <Text style={s.supplierSub}>{supplier.address}</Text>}
                {supplier.contact_name && <Text style={s.supplierSub}>担当　{supplier.contact_name}</Text>}
                {supplier.phone        && <Text style={s.supplierSub}>TEL　{supplier.phone}</Text>}
              </View>
            )}
          </View>

          {/* 右：発注元 */}
          <View style={s.colRight}>
            <Text style={s.issuerLine}>graff.</Text>
            <Text style={s.issuerLine}>{order.order_date.slice(0, 4)}年{order.order_date.slice(5, 7)}月{order.order_date.slice(8, 10)}日</Text>
          </View>
        </View>

        <View style={s.thinDivider} />

        {/* 本文 */}
        <Text style={s.bodyText}>下記の通り発注いたします。</Text>

        {/* 明細テーブル */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.cellNo]}>No.</Text>
          <Text style={[s.tableHeaderText, s.cellName]}>商品名</Text>
          <Text style={[s.tableHeaderText, s.cellQty]}>数量</Text>
          <Text style={[s.tableHeaderText, s.cellUnit]}>単位</Text>
        </View>

        {items.map((item, i) => (
          <View key={item.id} style={s.tableRow}>
            <Text style={s.cellNo}>{i + 1}</Text>
            <Text style={s.cellName}>{item.products.name}</Text>
            <Text style={s.cellQty}>{item.quantity}</Text>
            <Text style={s.cellUnit}>{item.products.unit}</Text>
          </View>
        ))}

        {/* 備考 */}
        {order.notes && (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>備考</Text>
            <Text style={s.notesText}>{order.notes}</Text>
          </View>
        )}

        {/* フッター */}
        <View style={s.footer}>
          <Text style={s.footerText}>graff. 統合管理システム</Text>
          <Text style={s.footerText}>No. {order.id.slice(-8).toUpperCase()}</Text>
        </View>

      </Page>
    </Document>
  )
}
