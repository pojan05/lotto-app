import Head from 'next/head'
import { useState, useEffect, useMemo } from 'react'
import { parseCSV, getStats, type ParsedResult } from '../lib/parseCSV'
import styles from './index.module.css'

type Tab = 'hot' | 'cold' | 'tod' | 'history'

export default function Home() {
  const [rows, setRows] = useState<ParsedResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [tab, setTab] = useState<Tab>('hot')
  const [showTypeMenu, setShowTypeMenu] = useState(false)

  useEffect(() => {
    fetch('/api/lotto')
      .then(r => {
        if (!r.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
        return r.text()
      })
      .then(text => {
        const parsed = parseCSV(text)
        setRows(parsed)
        const types = [...new Set(parsed.map(r => r.lottoType))].sort()
        if (types.length > 0) setSelectedType(types[0])
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  const lottoTypes = useMemo(() => {
    return [...new Set(rows.map(r => r.lottoType))].sort()
  }, [rows])

  const filtered = useMemo(() => {
    return rows
      .filter(r => r.lottoType === selectedType && r.bot2)
      .sort((a, b) => (b.date > a.date ? 1 : -1))
  }, [rows, selectedType])

  const stats = useMemo(() => getStats(filtered), [filtered])

  const maxBot2Count = useMemo(() => {
    return Math.max(...Object.values(stats.bot2Counts), 1)
  }, [stats.bot2Counts])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen msg={error} />

  return (
    <>
      <Head>
        <title>🛸 Alieninburi Lotto</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="ระบบวิเคราะห์สถิติหวย Alieninburi" />
      </Head>

      <div className={styles.root}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🛸</span>
              <div>
                <div className={styles.logoTitle}>ALIENINBURI</div>
                <div className={styles.logoSub}>LOTTO ANALYTICS</div>
              </div>
            </div>
            <div className={styles.totalBadge}>{filtered.length} งวด</div>
          </div>

          {/* Type Selector */}
          <div className={styles.typeSelector} onClick={() => setShowTypeMenu(true)}>
            <span className={styles.typeLabel}>หวย:</span>
            <span className={styles.typeValue}>{selectedType || 'เลือกประเภท'}</span>
            <span className={styles.typeArrow}>▾</span>
          </div>
        </header>

        {/* Type Menu Modal */}
        {showTypeMenu && (
          <div className={styles.overlay} onClick={() => setShowTypeMenu(false)}>
            <div className={styles.bottomSheet} onClick={e => e.stopPropagation()}>
              <div className={styles.sheetHandle} />
              <div className={styles.sheetTitle}>เลือกประเภทหวย</div>
              <div className={styles.typeList}>
                {lottoTypes.map(t => (
                  <div
                    key={t}
                    className={`${styles.typeItem} ${t === selectedType ? styles.typeItemActive : ''}`}
                    onClick={() => { setSelectedType(t); setShowTypeMenu(false) }}
                  >
                    <span>{t}</span>
                    {t === selectedType && <span className={styles.checkmark}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          <SummaryCard
            label="2 ตัวล่างออกบ่อยสุด"
            value={stats.sortedBot2[0]?.[0] || '-'}
            sub={`${stats.sortedBot2[0]?.[1] || 0} ครั้ง`}
            color="accent"
          />
          <SummaryCard
            label="โต๊ดออกบ่อยสุด"
            value={stats.sortedTod[0]?.[0] || '-'}
            sub={`${stats.sortedTod[0]?.[1] || 0} ครั้ง`}
            color="cyan"
          />
        </div>

        {/* Latest Result */}
        {filtered[0] && (
          <div className={styles.latestCard}>
            <div className={styles.latestDate}>งวดล่าสุด: {filtered[0].date}</div>
            <div className={styles.latestNumbers}>
              <div className={styles.numBox}>
                <div className={styles.numLabel}>3 ตัวบน</div>
                <div className={styles.numValue3}>{filtered[0].top3 || '---'}</div>
              </div>
              <div className={styles.numDivider} />
              <div className={styles.numBox}>
                <div className={styles.numLabel}>2 ตัวล่าง</div>
                <div className={styles.numValue2}>{filtered[0].bot2 || '--'}</div>
              </div>
              {filtered[0].top4 && (
                <>
                  <div className={styles.numDivider} />
                  <div className={styles.numBox}>
                    <div className={styles.numLabel}>4 ตัวบน</div>
                    <div className={styles.numValue4}>{filtered[0].top4}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { id: 'hot' as Tab, label: '🔥 ร้อนแรง' },
            { id: 'cold' as Tab, label: '❄️ เลขอั้น' },
            { id: 'tod' as Tab, label: '🎲 โต๊ด' },
            { id: 'history' as Tab, label: '📋 ประวัติ' },
          ].map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {tab === 'hot' && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>2 ตัวล่างออกบ่อยที่สุด</div>
              <div className={styles.barChart}>
                {stats.sortedBot2.slice(0, 15).map(([num, count], i) => (
                  <div key={num} className={styles.barRow}>
                    <div className={styles.barNum}>{num}</div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${(count / maxBot2Count) * 100}%`,
                          animationDelay: `${i * 40}ms`,
                          background: i === 0 ? 'var(--accent)' : i < 3 ? 'var(--accent2)' : 'var(--accent3)',
                        }}
                      />
                    </div>
                    <div className={styles.barCount}>{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'cold' && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>เลขอั้น (ห่างนานที่สุด)</div>
              <div className={styles.coldGrid}>
                {stats.cold.map(({ num, gap }, i) => (
                  <div key={num} className={`${styles.coldCard} ${i === 0 ? styles.coldTop : ''}`}>
                    <div className={styles.coldRank}>#{i + 1}</div>
                    <div className={styles.coldNum}>{num}</div>
                    <div className={styles.coldGap}>
                      {gap > 9999 ? 'ไม่เคยออก' : `หาย ${gap} งวด`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'tod' && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>ชุดโต๊ด 3 ตัวยอดนิยม</div>
              {stats.sortedTod.map(([key, count], i) => (
                <div key={key} className={styles.todRow}>
                  <div className={styles.todRank}>{i + 1}</div>
                  <div className={styles.todKey}>{key}</div>
                  <div className={styles.todPermutations}>
                    {getTodPermutations(key).map(p => (
                      <span key={p} className={styles.todPill}>{p}</span>
                    ))}
                  </div>
                  <div className={styles.todCount}>{count}×</div>
                </div>
              ))}
              {stats.sortedTod.length === 0 && (
                <div className={styles.empty}>ยังไม่มีข้อมูล</div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>ประวัติผลรางวัล</div>
              <div className={styles.historyList}>
                {filtered.slice(0, 30).map((r, i) => (
                  <div key={i} className={styles.historyRow}>
                    <div className={styles.historyDate}>{formatDate(r.date)}</div>
                    <div className={styles.historyNums}>
                      <span className={styles.h3}>{r.top3 || '---'}</span>
                      <span className={styles.hSep}>/</span>
                      <span className={styles.h2}>{r.bot2 || '--'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          อัปเดตอัตโนมัติทุกวัน • Powered by GitHub Actions
        </div>
      </div>
    </>
  )
}

function SummaryCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: 'accent' | 'cyan'
}) {
  return (
    <div className={`${styles.summaryCard} ${styles[`summaryCard_${color}`]}`}>
      <div className={styles.summaryLabel}>{label}</div>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summarySub}>{sub}</div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <div className={styles.loadingText}>กำลังโหลดข้อมูล...</div>
    </div>
  )
}

function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className={styles.center}>
      <div className={styles.errorIcon}>⚠️</div>
      <div className={styles.errorMsg}>{msg}</div>
      <div className={styles.errorHint}>
        ตั้งค่า GITHUB_CSV_URL ใน Vercel Environment Variables
      </div>
    </div>
  )
}

function getTodPermutations(key: string): string[] {
  if (key.length !== 3) return [key]
  const [a, b, c] = key.split('')
  const perms = new Set([
    `${a}${b}${c}`, `${a}${c}${b}`, `${b}${a}${c}`,
    `${b}${c}${a}`, `${c}${a}${b}`, `${c}${b}${a}`,
  ])
  return [...perms].slice(0, 6)
}

function formatDate(d: string): string {
  if (!d) return '-'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: '2-digit'
    })
  } catch {
    return d
  }
}
