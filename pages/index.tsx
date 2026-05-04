import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import {
  analyzeNumber,
  getLottoName,
  getQuickBacktest,
  getStats,
  parseCSV,
  type NumberAnalysis,
  type ParsedResult,
} from '../lib/parseCSV'
import { useMockBet, type BetType, type MockBet } from '../hooks/useMockBet'
import styles from './index.module.css'

type Tab = 'overview' | 'analyze' | 'hot' | 'cold' | 'history' | 'mybets'

export default function Home() {
  const [rows, setRows] = useState<ParsedResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/lotto')
      .then(async r => { if (!r.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ'); return r.text() })
      .then(text => {
        const parsed = parseCSV(text)
        setRows(parsed)
        const types = [...new Set(parsed.map(r => r.lottoType))].sort()
        if (types.length > 0) setSelectedType(types[0])
        setLoading(false)
      })
      .catch(err => { setError(err.message || 'เกิดข้อผิดพลาด'); setLoading(false) })
  }, [])

  const lottoTypes = useMemo(() => [...new Set(rows.map(r => r.lottoType))].sort(), [rows])

  const filtered = useMemo(() =>
    rows.filter(r => r.lottoType === selectedType).sort((a, b) => a.date < b.date ? 1 : -1),
    [rows, selectedType]
  )

  const stats = useMemo(() => getStats(filtered), [filtered])
  const backtest = useMemo(() => getQuickBacktest(filtered), [filtered])
  // โหมด Lite: ไม่คำนวณ Advanced / Monte Carlo ตอนเปิดหน้า เพื่อให้มือถือไม่หน่วง

  useEffect(() => {
    if (!query && stats.candidates2[0]) setQuery(stats.candidates2[0].number)
  }, [stats.candidates2, query])

  const analysis = useMemo(() => analyzeNumber(filtered, query), [filtered, query])
  const latest = filtered[0]

  const { bets, addBet, deleteBet, clearAll, stats: betStats, notification, mounted } = useMockBet(rows)

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen msg={error} />

  return (
    <>
      <Head>
        <title>Alieninburi Lotto</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className={styles.pageGlow} />

      {notification && (
        <div className={`${styles.notification} ${notification.isWin ? styles.notificationWin : styles.notificationLose}`}>
          {notification.message}
        </div>
      )}

      <main className={styles.root}>
        {/* Header */}
        <header className={styles.heroCard}>
          <div className={styles.heroTopRow}>
            <div className={styles.brandWrap}>
              <div className={styles.brandIcon}>🛸</div>
              <div>
                <div className={styles.brandEyebrow}>Alieninburi Lotto</div>
                <h1 className={styles.brandTitle}>Smart Analytics</h1>
              </div>
            </div>
            <div className={styles.roundBadge}>{filtered.length} งวด</div>
          </div>

          <button className={styles.typeSelector} onClick={() => setShowTypeMenu(true)}>
            <span className={styles.typeLabel}>ประเภทหวย</span>
            <span className={styles.typeValue}>{selectedType ? getLottoName(selectedType) : 'เลือกประเภท'}</span>
            <span className={styles.typeArrow}>▾</span>
          </button>
        </header>

        {/* Type Menu */}
        {showTypeMenu && (
          <div className={styles.overlay} onClick={() => setShowTypeMenu(false)}>
            <div className={styles.bottomSheet} onClick={e => e.stopPropagation()}>
              <div className={styles.sheetHandle} />
              <div className={styles.sheetTitle}>เลือกประเภทหวย</div>
              <div className={styles.typeList}>
                {lottoTypes.map(type => (
                  <button key={type}
                    className={`${styles.typeItem} ${type === selectedType ? styles.typeItemActive : ''}`}
                    onClick={() => { setSelectedType(type); setShowTypeMenu(false) }}>
                    <span>{getLottoName(type)}</span>
                    {type === selectedType && <span className={styles.checkmark}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Latest Result */}
        <section className={styles.latestCard}>
          <div className={styles.cardHead}>
            <div className={styles.sectionKicker}>ผลล่าสุด</div>
            <div className={styles.datePill}>{formatDate(latest?.date || '')}</div>
          </div>
          {latest ? (
            <div className={styles.latestNumbers}>
              <NumberBubble label="3 ตัวบน" value={latest.top3 || '---'} kind="gold" />
              <NumberBubble label="2 ตัวล่าง" value={latest.bot2 || '--'} kind="pink" />
              {latest.top4 && <NumberBubble label="4 ตัวบน" value={latest.top4} kind="blue" />}
            </div>
          ) : (
            <div className={styles.empty}>ยังไม่มีข้อมูลของประเภทนี้</div>
          )}
        </section>

        {/* Mini Stats */}
        <section className={styles.miniGrid}>
          <MiniStat title="2 ตัวออกบ่อยสุด" value={stats.sortedBot2[0]?.[0] || '--'} sub={`${stats.sortedBot2[0]?.[1] || 0} ครั้ง`} emoji="🔥" />
          <MiniStat title="เลขอั้นอันดับ 1" value={stats.cold[0]?.num || '--'} sub={stats.cold[0] ? `หาย ${stats.cold[0].gap} งวด` : '-'} emoji="❄️" />
          <MiniStat title="เลขคัดกรอง" value={stats.candidates2[0]?.number || '--'} sub={stats.candidates2[0] ? `${stats.candidates2[0].score}/10` : '-'} emoji="🎯" />
          <MiniStat title="ฐานข้อมูล" value={`${filtered.length}`} sub="งวดทั้งหมด" emoji="📊" />
        </section>

        {/* Tabs */}
        <nav className={styles.tabs}>
          {([
            { id: 'overview', label: 'ภาพรวม', icon: '✨' },
            { id: 'analyze', label: 'วิเคราะห์', icon: '🔎' },
            { id: 'hot', label: 'เลขเด่น', icon: '🔥' },
            { id: 'cold', label: 'เลขอั้น', icon: '❄️' },
            { id: 'history', label: 'ประวัติ', icon: '🕘' },
            { id: 'mybets', label: 'ของฉัน', icon: '🎯' },
          ] as { id: Tab; label: string; icon: string }[]).map(item => (
            <button key={item.id}
              className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
              onClick={() => setTab(item.id)}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab: Overview */}
        {tab === 'overview' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div className={styles.sectionKicker}>เลขคัดกรองเบื้องต้น</div>
              </div>
              <div className={styles.candidateGrid}>
                {stats.candidates2.slice(0, 6).map(item => (
                  <button key={item.number} className={styles.candidateCard} onClick={() => { setQuery(item.number); setTab('analyze') }}>
                    <div className={styles.candidateTop}>
                      <span className={styles.candidateNum}>{item.number}</span>
                      <span className={styles.scoreBadge}>คะแนน {item.score}/10</span>
                    </div>
                    <div className={styles.candidateMeta}>ออกทั้งหมด {item.frequencyAll} ครั้ง • หาย {item.gap} งวด</div>
                    <div className={styles.candidateLevel}>
                      {item.reasons.slice(0, 3).map(reason => <span key={reason}>{reason}</span>)}
                    </div>
                  </button>
                ))}
              </div>
            </section>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div className={styles.sectionKicker}>Backtest แบบเร็ว (3 เลข/งวด x 5 บาท)</div>
              </div>
              <div className={styles.backtestGrid}>
                <BacktestItem label="งวดที่ทดสอบ" value={`${backtest.rounds}`} />
                <BacktestItem label="ถูก" value={`${backtest.wins}`} />
                <BacktestItem label="Hit rate" value={`${backtest.hitRate}%`} />
                <BacktestItem label="กำไรสุทธิ" value={`${backtest.profit > 0 ? '+' : ''}${backtest.profit}`} accent={backtest.profit >= 0} />
              </div>
            </section>
          </div>
        )}

        {/* Tab: Analyze */}
        {tab === 'analyze' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div className={styles.sectionKicker}>วิเคราะห์เลข (2 หรือ 3 ตัว)</div>
              </div>
              <div className={styles.analyzeBox}>
                <div className={styles.searchWrap}>
                  <input className={styles.searchInput} value={query} maxLength={3} inputMode="numeric"
                    onChange={e => setQuery(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="เช่น 16 หรือ 616" />
                </div>
                <div className={styles.quickPickRow}>
                  {stats.candidates2.slice(0, 8).map(item => (
                    <button key={item.number} className={styles.quickChip} onClick={() => setQuery(item.number)}>{item.number}</button>
                  ))}
                </div>
                {analysis ? <AnalysisCard analysis={analysis} /> : <div className={styles.empty}>ใส่เลข 2 หรือ 3 ตัว</div>}
              </div>
            </section>
          </div>
        )}

        {/* Tab: Hot */}
        {tab === 'hot' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div className={styles.sectionKicker}>เลข 2 ตัวออกบ่อยสุด ({filtered.length} งวด)</div>
              </div>
              <div className={styles.rankingList}>
                {stats.sortedBot2.slice(0, 20).map(([num, count], i) => (
                  <button key={num} className={styles.rankRow} onClick={() => { setQuery(num); setTab('analyze') }}>
                    <div className={styles.rankLeft}>
                      <div className={styles.rankIndex}>#{i + 1}</div>
                      <div className={styles.rankNumber}>{num}</div>
                    </div>
                    <div className={styles.rankRight}>
                      <div className={styles.rankMain}>{count} ครั้ง</div>
                      <div className={styles.rankSub}>จาก {filtered.length} งวด ({round1((count/filtered.length)*100)}%)</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Tab: Cold */}
        {tab === 'cold' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div className={styles.sectionKicker}>เลขที่หายไปนานที่สุด</div>
              </div>
              <div className={styles.coldGrid}>
                {stats.cold.map((item, i) => (
                  <button key={item.num} className={styles.coldCard} onClick={() => { setQuery(item.num); setTab('analyze') }}>
                    <div className={styles.coldTopRow}>
                      <span className={styles.coldRank}>#{i + 1}</span>
                      <span className={styles.coldTap}>วิเคราะห์</span>
                    </div>
                    <div className={styles.coldNum}>{item.num}</div>
                    <div className={styles.coldGap}>{item.gap > filtered.length + 10 ? 'ไม่เคยออก' : `หาย ${item.gap} งวด`}</div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Tab: History */}
        {tab === 'history' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div className={styles.sectionKicker}>ประวัติผล {filtered.length} งวด</div>
              </div>
              <div className={styles.historyList}>
                {filtered.slice(0, 50).map((row, i) => (
                  <div key={`${row.date}-${i}`} className={styles.historyRow}>
                    <div className={styles.historyDate}>{formatDate(row.date)}</div>
                    <div className={styles.historyNumGroup}>
                      <span className={`${styles.historyNumber} ${styles.historyGold}`}>{row.top3 || '---'}</span>
                      <span className={`${styles.historyNumber} ${styles.historyPink}`}>{row.bot2 || '--'}</span>
                      {row.top4 && <span className={`${styles.historyNumber} ${styles.historyBlue}`}>{row.top4}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Tab: My Bets */}
        {tab === 'mybets' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div className={styles.sectionKicker}>📊 สถิติส่วนตัว (เก็บในเครื่องคุณ)</div>
              </div>
              {mounted && (
                <div className={styles.betStatsGrid}>
                  <div className={styles.betStatCard}><div className={styles.betStatValue}>{betStats.total}</div><div className={styles.betStatLabel}>ทั้งหมด</div></div>
                  <div className={styles.betStatCard}><div className={`${styles.betStatValue} ${styles.betStatWin}`}>{betStats.wins}</div><div className={styles.betStatLabel}>ถูก 🎉</div></div>
                  <div className={styles.betStatCard}><div className={`${styles.betStatValue} ${styles.betStatLose}`}>{betStats.losses}</div><div className={styles.betStatLabel}>ไม่ถูก</div></div>
                  <div className={styles.betStatCard}><div className={styles.betStatValue}>{betStats.winRate}%</div><div className={styles.betStatLabel}>แม่นยำ</div></div>
                </div>
              )}
              {mounted && betStats.total > 0 && (
                <div className={styles.betExtraStats}>
                  <span>🏆 หวยที่แม่น: <strong>{betStats.bestLotto.name}</strong> ({betStats.bestLotto.rate}%)</span>
                  <span>🔢 เลขโปรด: <strong>{betStats.topNumber}</strong></span>
                </div>
              )}
            </section>

            <MockBetForm lottoTypes={lottoTypes} getLottoName={getLottoName} latestResult={filtered[0]} onAdd={addBet} />

            {mounted && bets.length > 0 && (
              <section className={styles.panel}>
                <div className={styles.cardHead}>
                  <div className={styles.sectionKicker}>รายการทั้งหมด</div>
                  <button className={styles.clearBtn} onClick={() => { if (confirm('ลบข้อมูลทั้งหมดใช่ไหม?')) clearAll() }}>ล้างทั้งหมด</button>
                </div>
                <div className={styles.betList}>
                  {[...bets].reverse().map(bet => <BetCard key={bet.id} bet={bet} onDelete={deleteBet} />)}
                </div>
              </section>
            )}

            {mounted && bets.length === 0 && (
              <div className={styles.emptyBets}>
                <div className={styles.emptyBetsIcon}>🎯</div>
                <div className={styles.emptyBetsTitle}>ยังไม่มีรายการ</div>
                <p>กรอกเลขที่มั่นใจแล้วกด บันทึก ข้อมูลเก็บในเครื่องนี้เท่านั้น</p>
              </div>
            )}
          </div>
        )}

        <footer className={styles.footer}>อัปเดตอัตโนมัติทุกวัน • ข้อมูลเก็บจาก GitHub</footer>
      </main>
    </>
  )
}

// ─── Components ─────────────────────────────────────────────────────────────

function NumberBubble({ label, value, kind }: { label: string; value: string; kind: 'gold' | 'pink' | 'blue' }) {
  return (
    <div className={`${styles.numberBubble} ${styles[`numberBubble_${kind}`]}`}>
      <div className={styles.numberLabel}>{label}</div>
      <div className={styles.numberValue}>{value}</div>
    </div>
  )
}

function MiniStat({ title, value, sub, emoji }: { title: string; value: string; sub: string; emoji: string }) {
  return (
    <div className={styles.miniCard}>
      <div className={styles.miniTitle}><span>{emoji}</span>{title}</div>
      <div className={styles.miniValue}>{value}</div>
      <div className={styles.miniSub}>{sub}</div>
    </div>
  )
}

function BacktestItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={styles.backtestItem}>
      <div className={styles.backtestLabel}>{label}</div>
      <div className={`${styles.backtestValue} ${accent ? styles.backtestValuePositive : ''}`}>{value}</div>
    </div>
  )
}

function AnalysisCard({ analysis }: { analysis: NumberAnalysis }) {
  return (
    <div className={styles.analysisCard}>
      <div className={styles.analysisHeader}>
        <div>
          <div className={styles.analysisType}>{analysis.type}</div>
          <div className={styles.analysisNumber}>{analysis.number}</div>
        </div>
        <div className={styles.analysisScoreWrap}>
          <div className={styles.analysisScore}>{analysis.score}</div>
          <div className={styles.analysisScoreLabel}>/ 10</div>
        </div>
      </div>
      <div className={styles.analysisTag}>{analysis.level}</div>
      <div className={styles.analysisGrid}>
        <div className={styles.analysisMetric}><span>ออกทั้งหมด</span><strong>{analysis.frequencyAll} ครั้ง</strong></div>
        <div className={styles.analysisMetric}><span>ออกใน 30 งวด</span><strong>{analysis.frequency30} ครั้ง</strong></div>
        <div className={styles.analysisMetric}><span>ขาดไป</span><strong>{analysis.gap} งวด</strong></div>
        <div className={styles.analysisMetric}><span>โต๊ดสัมพันธ์</span><strong>{analysis.todMatches} ครั้ง</strong></div>
        {analysis.reverseNumber && <div className={styles.analysisMetric}><span>เลขกลับ</span><strong>{analysis.reverseNumber} ({analysis.reverseFrequency} ครั้ง)</strong></div>}
      </div>
      {analysis.reasons.length > 0 && (
        <div className={styles.reasonsBox}>
          <div className={styles.reasonsTitle}>เหตุผล</div>
          <ul className={styles.reasonsList}>
            {analysis.reasons.map(r => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className={styles.center}>
      <div className={styles.loaderPlanet} />
      <div className={styles.centerTitle}>กำลังโหลด...</div>
    </div>
  )
}

function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className={styles.center}>
      <div className={styles.centerEmoji}>⚠️</div>
      <div className={styles.centerTitle}>โหลดไม่สำเร็จ</div>
      <div className={styles.centerText}>{msg}</div>
    </div>
  )
}

function formatDate(d: string) {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

function round1(n: number) { return Math.round(n * 10) / 10 }

// ─── MockBetForm ─────────────────────────────────────────────────────────────
function MockBetForm({ lottoTypes, getLottoName, latestResult, onAdd }: {
  lottoTypes: string[]; getLottoName: (c: string) => string
  latestResult: ParsedResult | undefined
  onAdd: (bet: Omit<MockBet, 'id' | 'timestamp' | 'status'>) => void
}) {
  const [lottoCode, setLottoCode] = useState(lottoTypes[0] || '')
  const [betType, setBetType] = useState<BetType>('2ตัวล่าง')
  const [number, setNumber] = useState('')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const maxLen = betType === '3ตัวบน' || betType === 'โต๊ด3ตัว' ? 3 : betType.startsWith('วิ่ง') ? 1 : 2
  const betTypes: BetType[] = ['3ตัวบน', '2ตัวล่าง', 'โต๊ด3ตัว', 'วิ่งบน', 'วิ่งล่าง']

  return (
    <section className={styles.panel}>
      <div className={styles.cardHead}>
        <div className={styles.sectionKicker}>ทดลองซื้อ — บันทึกเลขที่มั่นใจ</div>
      </div>
      {latestResult && (
        <div className={styles.refResult}>
          <span className={styles.refLabel}>งวดล่าสุด {formatDate(latestResult.date)}:</span>
          <span className={styles.refNumbers}>
            <span className={styles.refGold}>{latestResult.top3 || '---'}</span>
            <span className={styles.refPink}>{latestResult.bot2 || '--'}</span>
          </span>
        </div>
      )}
      <div className={styles.betFormGrid}>
        <div className={styles.betFormGroup}>
          <label className={styles.betLabel}>หวย</label>
          <select className={styles.betSelect} value={lottoCode} onChange={e => setLottoCode(e.target.value)}>
            {lottoTypes.map(t => <option key={t} value={t}>{getLottoName(t)}</option>)}
          </select>
        </div>
        <div className={styles.betFormGroup}>
          <label className={styles.betLabel}>ประเภท</label>
          <div className={styles.betTypeRow}>
            {betTypes.map(bt => (
              <button key={bt} className={`${styles.betTypeChip} ${betType === bt ? styles.betTypeChipActive : ''}`}
                onClick={() => { setBetType(bt); setNumber('') }}>{bt}</button>
            ))}
          </div>
        </div>
        <div className={styles.betFormGroup}>
          <label className={styles.betLabel}>เลข ({maxLen} ตัว)</label>
          <input className={styles.betNumberInput} value={number} maxLength={maxLen} inputMode="numeric"
            onChange={e => setNumber(e.target.value.replace(/\D/g, '').slice(0, maxLen))}
            placeholder={'0'.repeat(maxLen)} />
        </div>
        <div className={styles.betFormGroup}>
          <label className={styles.betLabel}>งวดวันที่</label>
          <input type="date" className={styles.betDateInput} value={targetDate} onChange={e => setTargetDate(e.target.value)} />
        </div>
      </div>
      <button className={styles.betSubmitBtn} disabled={number.length < maxLen}
        onClick={() => { onAdd({ lottoCode, lottoName: getLottoName(lottoCode), targetDate, betType, number }); setNumber('') }}>
        🎯 บันทึก
      </button>
    </section>
  )
}

function BetCard({ bet, onDelete }: { bet: MockBet; onDelete: (id: string) => void }) {
  const icon = bet.status === 'win' ? '🎉' : bet.status === 'lose' ? '😔' : '⏳'
  const label = bet.status === 'win' ? 'ถูก!' : bet.status === 'lose' ? 'ไม่ถูก' : 'รอผล'
  return (
    <div className={`${styles.betCard} ${styles[`betCard_${bet.status}`]}`}>
      <div className={styles.betCardTop}>
        <div className={styles.betCardLotto}>{bet.lottoName}</div>
        <div className={`${styles.betCardStatus} ${styles[`betStatus_${bet.status}`]}`}>{icon} {label}</div>
      </div>
      <div className={styles.betCardBody}>
        <div className={styles.betCardNumber}>{bet.number}</div>
        <div className={styles.betCardMeta}>
          <span>{bet.betType}</span>
          <span>งวด {formatDate(bet.targetDate)}</span>
          {bet.actualResult && <span>ออก: {bet.actualResult}</span>}
        </div>
      </div>
      <button className={styles.betDeleteBtn} onClick={() => onDelete(bet.id)}>✕</button>
    </div>
  )
}
