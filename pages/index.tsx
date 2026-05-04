import Head from 'next/head'
import { useState, useEffect, useMemo } from 'react'
import {
  parseCSV,
  getStats,
  getLottoName,
  analyzeNumber,
  runBacktest,
  type ParsedResult,
  type NumberAnalysis,
} from '../lib/parseCSV'
import styles from './index.module.css'

type Tab = 'analyze' | 'hot' | 'cold' | 'tod' | 'backtest' | 'history'

export default function Home() {
  const [rows, setRows] = useState<ParsedResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [tab, setTab] = useState<Tab>('analyze')
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [numberInput, setNumberInput] = useState('')

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

  const lottoTypes = useMemo(() => [...new Set(rows.map(r => r.lottoType))].sort(), [rows])

  const filtered = useMemo(() => {
    return rows
      .filter(r => r.lottoType === selectedType && (r.bot2 || r.top3))
      .sort((a, b) => (b.date > a.date ? 1 : -1))
  }, [rows, selectedType])

  const stats = useMemo(() => getStats(filtered), [filtered])

  const maxBot2Count = useMemo(() => Math.max(...Object.values(stats.bot2Counts), 1), [stats.bot2Counts])

  const analysis: NumberAnalysis | null = useMemo(() => {
    return numberInput ? analyzeNumber(filtered, numberInput) : null
  }, [filtered, numberInput])

  const backtest = useMemo(() => runBacktest(filtered, 30, 3, 5, 90), [filtered])

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
        <div className={styles.bgOrbA} />
        <div className={styles.bgOrbB} />

        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🛸</span>
              <div>
                <div className={styles.logoTitle}>ALIENINBURI</div>
                <div className={styles.logoSub}>Cute Lotto Lab</div>
              </div>
            </div>
            <div className={styles.totalBadge}>{filtered.length} งวด</div>
          </div>

          <div className={styles.typeSelector} onClick={() => setShowTypeMenu(true)}>
            <span className={styles.typeLabel}>ตลาด</span>
            <span className={styles.typeValue}>{selectedType ? getLottoName(selectedType) : 'เลือกประเภท'}</span>
            <span className={styles.typeArrow}>▾</span>
          </div>
        </header>

        {showTypeMenu && (
          <div className={styles.overlay} onClick={() => setShowTypeMenu(false)}>
            <div className={styles.bottomSheet} onClick={e => e.stopPropagation()}>
              <div className={styles.sheetHandle} />
              <div className={styles.sheetTitle}>เลือกตลาด/ประเภทหวย</div>
              <div className={styles.typeList}>
                {lottoTypes.map(t => (
                  <div
                    key={t}
                    className={`${styles.typeItem} ${t === selectedType ? styles.typeItemActive : ''}`}
                    onClick={() => { setSelectedType(t); setShowTypeMenu(false) }}
                  >
                    <span>{getLottoName(t)}</span>
                    {t === selectedType && <span className={styles.checkmark}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className={styles.main}>
          <section className={styles.heroCard}>
            <div className={styles.heroKicker}>AI-assisted statistics • ไม่ใช่เลขล็อก</div>
            <h1 className={styles.heroTitle}>ใส่เลขแล้วให้ระบบช่วยคัด</h1>
            <p className={styles.heroText}>ดูความถี่ ระยะขาด เลขเพิ่งออก คะแนนความเสี่ยง และทดสอบสูตรย้อนหลัง ก่อนตัดสินใจใช้เงินจริง</p>
            <div className={styles.analyzeBox}>
              <input
                className={styles.numberInput}
                value={numberInput}
                onChange={e => setNumberInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="ใส่เลข 2 หรือ 3 ตัว เช่น 16 / 616"
              />
              <button className={styles.clearButton} onClick={() => setNumberInput('')}>ล้าง</button>
            </div>
          </section>

          <div className={styles.summaryGrid}>
            <SummaryCard label="2 ตัวล่างเด่นสุด" value={stats.recommendations[0]?.num || '-'} sub={`${stats.recommendations[0]?.score || 0}/10 คะแนน`} color="accent" />
            <SummaryCard label="สูตรย้อนหลัง" value={`${backtest.hitRate}%`} sub={`${backtest.hits}/${backtest.rounds} งวดเข้าเป้า`} color="cyan" />
          </div>

          {analysis && <AnalysisCard analysis={analysis} />}
          {!analysis && <TopPicks recommendations={stats.recommendations.slice(0, 5)} />}

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

          <div className={styles.tabs}>
            {[
              { id: 'analyze' as Tab, label: '💖 วิเคราะห์' },
              { id: 'hot' as Tab, label: '🔥 ร้อน' },
              { id: 'cold' as Tab, label: '❄️ เย็น' },
              { id: 'tod' as Tab, label: '🎲 โต๊ด' },
              { id: 'backtest' as Tab, label: '🧪 Backtest' },
              { id: 'history' as Tab, label: '📋 ประวัติ' },
            ].map(t => (
              <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {tab === 'analyze' && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>เลขที่ระบบคัดจากคะแนนรวม</div>
                <div className={styles.pickGrid}>
                  {stats.recommendations.slice(0, 12).map((p, i) => (
                    <button key={p.num} className={styles.pickCard} onClick={() => setNumberInput(p.num)}>
                      <div className={styles.pickRank}>#{i + 1}</div>
                      <div className={styles.pickNum}>{p.num}</div>
                      <div className={styles.pickScore}>{p.score}/10</div>
                      <div className={styles.pickReason}>{p.reason}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'hot' && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>2 ตัวล่างออกบ่อยที่สุด</div>
                <div className={styles.barChart}>
                  {stats.sortedBot2.slice(0, 15).map(([num, count], i) => (
                    <div key={num} className={styles.barRow}>
                      <div className={styles.barNum}>{num}</div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${(count / maxBot2Count) * 100}%`, animationDelay: `${i * 40}ms` }} />
                      </div>
                      <div className={styles.barCount}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'cold' && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>เลขเย็น/เลขขาดนาน</div>
                <div className={styles.coldGrid}>
                  {stats.cold.map(({ num, gap }, i) => (
                    <div key={num} className={`${styles.coldCard} ${i === 0 ? styles.coldTop : ''}`} onClick={() => setNumberInput(num)}>
                      <div className={styles.coldRank}>#{i + 1}</div>
                      <div className={styles.coldNum}>{num}</div>
                      <div className={styles.coldGap}>{gap > 999 ? 'ไม่เคยออก' : `หาย ${gap} งวด`}</div>
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
                      {getTodPermutations(key).map(p => <span key={p} className={styles.todPill}>{p}</span>)}
                    </div>
                    <div className={styles.todCount}>{count}×</div>
                  </div>
                ))}
                {stats.sortedTod.length === 0 && <div className={styles.empty}>ยังไม่มีข้อมูล</div>}
              </div>
            )}

            {tab === 'backtest' && <BacktestCard result={backtest} />}

            {tab === 'history' && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>ประวัติผลรางวัล</div>
                <div className={styles.historyList}>
                  {filtered.slice(0, 30).map((r, i) => (
                    <div key={`${r.date}-${i}`} className={styles.historyRow}>
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
        </main>

        <div className={styles.footer}>ใช้เพื่อวิเคราะห์สถิติเท่านั้น • จำกัดทุนและทดสอบสูตรก่อนเสมอ</div>
      </div>
    </>
  )
}

function AnalysisCard({ analysis }: { analysis: NumberAnalysis }) {
  return (
    <section className={styles.resultCard}>
      <div className={styles.resultTop}>
        <div>
          <div className={styles.resultLabel}>ผลวิเคราะห์เลข {analysis.input}</div>
          <div className={styles.resultStatus}>{analysis.status}</div>
        </div>
        <div className={`${styles.scoreBubble} ${styles[`risk_${analysis.risk}`]}`}>{analysis.score}</div>
      </div>
      <div className={styles.metricGrid}>
        <Metric label="ชนิด" value={analysis.type} />
        <Metric label="เคยออก" value={`${analysis.frequency} ครั้ง`} />
        <Metric label="ห่างล่าสุด" value={`${analysis.gap} งวด`} />
        <Metric label="ล่าสุด" value={analysis.lastSeenDate} />
      </div>
      <div className={styles.reasonList}>
        {analysis.reasons.map(reason => <div key={reason} className={styles.reasonItem}>✦ {reason}</div>)}
      </div>
      <div className={styles.warningBox}>⚠️ {analysis.warning}</div>
    </section>
  )
}

function TopPicks({ recommendations }: { recommendations: { num: string; score: number; reason: string }[] }) {
  return (
    <section className={styles.resultCard}>
      <div className={styles.resultLabel}>ยังไม่ได้ใส่เลข — ระบบเสนอเลขคัดกรองเบื้องต้น</div>
      <div className={styles.miniPickRow}>
        {recommendations.map(p => (
          <div key={p.num} className={styles.miniPick}>
            <strong>{p.num}</strong>
            <span>{p.score}/10</span>
          </div>
        ))}
      </div>
      <div className={styles.warningBox}>แตะเลขในแท็บวิเคราะห์เพื่อดูเหตุผลแบบละเอียด</div>
    </section>
  )
}

function BacktestCard({ result }: { result: ReturnType<typeof runBacktest> }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionTitle}>ทดสอบสูตรย้อนหลัง</div>
      <div className={styles.backtestCard}>
        <div className={styles.backtestHero}>
          <div>
            <div className={styles.backtestLabel}>เลือก 3 เลข/งวด จากข้อมูลย้อนหลัง 30 งวด</div>
            <div className={styles.backtestProfit}>{result.profit >= 0 ? '+' : ''}{result.profit.toLocaleString()} บาท</div>
          </div>
          <div className={styles.backtestRoi}>{result.roi}% ROI</div>
        </div>
        <div className={styles.metricGrid}>
          <Metric label="ทดสอบ" value={`${result.rounds} งวด`} />
          <Metric label="เข้าเป้า" value={`${result.hits} ครั้ง`} />
          <Metric label="อัตราเข้า" value={`${result.hitRate}%`} />
          <Metric label="ทุนรวม" value={`${result.stake} บาท`} />
        </div>
        <div className={styles.warningBox}>สูตรนี้เป็น backtest แบบง่าย: แทงเลขละ 5 บาท จ่าย 90 เท่า ใช้ตรวจว่าระบบมีแต้มต่อไหม ไม่ใช่การรับประกันผลลัพธ์</div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'accent' | 'cyan' }) {
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
      <div className={styles.errorHint}>ตั้งค่า GITHUB_CSV_URL ใน Vercel Environment Variables</div>
    </div>
  )
}

function getTodPermutations(key: string): string[] {
  if (key.length !== 3) return [key]
  const [a, b, c] = key.split('')
  const perms = new Set([`${a}${b}${c}`, `${a}${c}${b}`, `${b}${a}${c}`, `${b}${c}${a}`, `${c}${a}${b}`, `${c}${b}${a}`])
  return [...perms].slice(0, 6)
}

function formatDate(d: string): string {
  if (!d) return '-'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return d
  }
}
