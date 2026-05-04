import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import {
  analyzeNumber,
  getAdvancedAnalytics,
  getLottoName,
  getQuickBacktest,
  getStats,
  parseCSV,
  type AdvancedPick,
  type NumberAnalysis,
  type ParsedResult,
  type StrategyBacktest,
} from '../lib/parseCSV'
import { useMockBet, type BetType, type MockBet } from '../hooks/useMockBet'
import styles from './index.module.css'

type Tab = 'overview' | 'analyze' | 'heatmap' | 'backtest' | 'ai' | 'hot' | 'cold' | 'history' | 'mybets'

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
      .then(async response => {
        if (!response.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
        return response.text()
      })
      .then(text => {
        const parsed = parseCSV(text)
        setRows(parsed)
        const types = [...new Set(parsed.map(r => r.lottoType))].sort()
        if (types.length > 0) setSelectedType(types[0])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'เกิดข้อผิดพลาด')
        setLoading(false)
      })
  }, [])

  const lottoTypes = useMemo(() => [...new Set(rows.map(r => r.lottoType))].sort(), [rows])

  const filtered = useMemo(() => {
    return rows
      .filter(r => r.lottoType === selectedType)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [rows, selectedType])

  const stats = useMemo(() => getStats(filtered), [filtered])
  const advanced = useMemo(() => getAdvancedAnalytics(filtered), [filtered])
  const backtest = useMemo(() => getQuickBacktest(filtered), [filtered])
  const { bets, addBet, deleteBet, clearAll, stats: betStats, notification, mounted } = useMockBet(rows)

  useEffect(() => {
    if (!query && stats.candidates2[0]) {
      setQuery(stats.candidates2[0].number)
    }
  }, [stats.candidates2, query])

  const analysis = useMemo(() => analyzeNumber(filtered, query), [filtered, query])
  const latest = filtered[0]

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen msg={error} />

  return (
    <>
      <Head>
        <title>Alieninburi Lotto • Smart Cute Analytics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta
          name="description"
          content="วิเคราะห์สถิติหวยด้วยหน้าตาทันสมัย อ่านง่าย ตัวเลขชัด พร้อมระบบวิเคราะห์เลขและคัดกรองเลขเด่น"
        />
      </Head>

      <div className={styles.pageGlow} />
      <main className={styles.root}>
        <header className={styles.heroCard}>
          <div className={styles.heroTopRow}>
            <div className={styles.brandWrap}>
              <div className={styles.brandIcon}>🛸</div>
              <div>
                <div className={styles.brandEyebrow}>Alieninburi Lotto</div>
                <h1 className={styles.brandTitle}>Cute Smart Analytics</h1>
              </div>
            </div>
            <div className={styles.roundBadge}>{filtered.length} งวด</div>
          </div>

          <div className={styles.heroContent}>
            <div>
              <div className={styles.heroHeading}>วิเคราะห์เลขให้อ่านง่าย ตัวเลขเด่นชัด หน้าตาทันสมัย</div>
              <p className={styles.heroText}>
                เลือกประเภทหวย ดูผลล่าสุด ดูเลขร้อน เลขอั้น และใส่เลขเพื่อเช็กคะแนนจากข้อมูลย้อนหลังได้ทันที
              </p>
            </div>

            <button className={styles.typeSelector} onClick={() => setShowTypeMenu(true)}>
              <span className={styles.typeLabel}>ประเภทหวย</span>
              <span className={styles.typeValue}>{selectedType ? getLottoName(selectedType) : 'เลือกประเภทหวย'}</span>
              <span className={styles.typeArrow}>▾</span>
            </button>
          </div>
        </header>

        {showTypeMenu && (
          <div className={styles.overlay} onClick={() => setShowTypeMenu(false)}>
            <div className={styles.bottomSheet} onClick={e => e.stopPropagation()}>
              <div className={styles.sheetHandle} />
              <div className={styles.sheetTitle}>เลือกประเภทหวย</div>
              <div className={styles.typeList}>
                {lottoTypes.map(type => (
                  <button
                    key={type}
                    className={`${styles.typeItem} ${type === selectedType ? styles.typeItemActive : ''}`}
                    onClick={() => {
                      setSelectedType(type)
                      setShowTypeMenu(false)
                    }}
                  >
                    <span>{getLottoName(type)}</span>
                    {type === selectedType && <span className={styles.checkmark}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <section className={styles.latestCard}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.sectionKicker}>ผลล่าสุด</div>
              <h2 className={styles.sectionTitle}>ตัวเลขล่าสุดใหญ่ ชัด สะอาดตา</h2>
            </div>
            <div className={styles.datePill}>{formatDate(latest?.date || '')}</div>
          </div>

          {latest ? (
            <div className={styles.latestNumbers}>
              <NumberBubble label="3 ตัวบน" value={latest.top3 || '---'} kind="gold" />
              <NumberBubble label="2 ตัวล่าง" value={latest.bot2 || '--'} kind="pink" />
              <NumberBubble label="4 ตัวบน" value={latest.top4 || '----'} kind="blue" />
            </div>
          ) : (
            <div className={styles.empty}>ยังไม่มีข้อมูลของประเภทนี้</div>
          )}
        </section>

        <section className={styles.miniGrid}>
          <MiniStat
            title="เลข 2 ตัวที่ออกบ่อยสุด"
            value={stats.sortedBot2[0]?.[0] || '--'}
            sub={`${stats.sortedBot2[0]?.[1] || 0} ครั้ง`}
            emoji="🔥"
          />
          <MiniStat
            title="เลขอั้นอันดับ 1"
            value={stats.cold[0]?.num || '--'}
            sub={stats.cold[0] ? `หาย ${stats.cold[0].gap} งวด` : '-'}
            emoji="❄️"
          />
          <MiniStat
            title="เลขคัดกรองเด่น"
            value={stats.candidates2[0]?.number || '--'}
            sub={stats.candidates2[0] ? `${stats.candidates2[0].score}/10` : '-'}
            emoji="🎯"
          />
          <MiniStat
            title="Monte Carlo"
            value={`${advanced.monteCarloRuns.toLocaleString()}`}
            sub="จำลองรอบ"
            emoji="🎲"
          />
        </section>

        <nav className={styles.tabs}>
          {[
            { id: 'overview' as Tab, label: 'ภาพรวม', icon: '✨' },
            { id: 'analyze' as Tab, label: 'วิเคราะห์เลข', icon: '🔎' },
            { id: 'heatmap' as Tab, label: 'Heatmap', icon: '🧊' },
            { id: 'backtest' as Tab, label: 'Backtest', icon: '📈' },
            { id: 'ai' as Tab, label: 'AI Insight', icon: '🤖' },
            { id: 'hot' as Tab, label: 'เลขเด่น', icon: '🔥' },
            { id: 'cold' as Tab, label: 'เลขอั้น', icon: '❄️' },
            { id: 'history' as Tab, label: 'ประวัติ', icon: '🕘' },
            { id: 'mybets' as Tab, label: 'ของฉัน', icon: '🎯' },
          ].map(item => (
            <button
              key={item.id}
              className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
              onClick={() => setTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>เลขคัดกรอง</div>
                  <h2 className={styles.sectionTitle}>เลขน่าจับตาจากข้อมูลย้อนหลัง</h2>
                </div>
              </div>
              <div className={styles.candidateGrid}>
                {advanced.picks.slice(0, 6).map(item => (
                  <AdvancedPickCard
                    key={item.number}
                    item={item}
                    onClick={() => {
                      setQuery(item.number)
                      setTab('analyze')
                    }}
                  />
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>Backtest</div>
                  <h2 className={styles.sectionTitle}>ลองจำลองสูตรเลขเด่นแบบง่าย</h2>
                </div>
              </div>
              <div className={styles.backtestGrid}>
                <BacktestItem label="งวดที่ทดสอบ" value={`${backtest.rounds}`} />
                <BacktestItem label="ชนะ" value={`${backtest.wins}`} />
                <BacktestItem label="Hit rate" value={`${backtest.hitRate}%`} />
                <BacktestItem label="กำไรสุทธิ" value={`${backtest.profit}`} accent={backtest.profit >= 0} />
              </div>
              <p className={styles.caption}>
                ทดสอบจากสูตรเลือก 3 เลขคะแนนสูงสุดในแต่ละงวด งวดละ 5 บาท/เลข เพื่อดูแนวโน้มของสูตรเบื้องต้น
              </p>
            </section>
          </div>
        )}

        {tab === 'analyze' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>วิเคราะห์เลข</div>
                  <h2 className={styles.sectionTitle}>ใส่เลข 2 หรือ 3 ตัวเพื่อดูคะแนน</h2>
                </div>
              </div>
              <div className={styles.analyzeBox}>
                <div className={styles.searchWrap}>
                  <input
                    className={styles.searchInput}
                    value={query}
                    maxLength={3}
                    inputMode="numeric"
                    onChange={e => setQuery(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="เช่น 16 หรือ 616"
                  />
                  <div className={styles.searchHint}>รองรับเลข 2 ตัว และ 3 ตัว</div>
                </div>

                <div className={styles.quickPickRow}>
                  {stats.candidates2.slice(0, 8).map(item => (
                    <button key={item.number} className={styles.quickChip} onClick={() => setQuery(item.number)}>
                      {item.number}
                    </button>
                  ))}
                </div>

                {analysis ? <AnalysisCard analysis={analysis} /> : <div className={styles.empty}>ใส่เลข 2 หรือ 3 ตัวเพื่อเริ่มวิเคราะห์</div>}
              </div>
            </section>
          </div>
        )}

        {tab === 'hot' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>เลขเด่น</div>
                  <h2 className={styles.sectionTitle}>เลข 2 ตัวที่ออกบ่อยที่สุด</h2>
                </div>
              </div>
              <div className={styles.rankingList}>
                {stats.sortedBot2.slice(0, 20).map(([num, count], index) => (
                  <button key={num} className={styles.rankRow} onClick={() => { setQuery(num); setTab('analyze') }}>
                    <div className={styles.rankLeft}>
                      <div className={styles.rankIndex}>#{index + 1}</div>
                      <div className={styles.rankNumber}>{num}</div>
                    </div>
                    <div className={styles.rankRight}>
                      <div className={styles.rankMain}>{count} ครั้ง</div>
                      <div className={styles.rankSub}>แตะเพื่อวิเคราะห์ต่อ</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'cold' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>เลขอั้น</div>
                  <h2 className={styles.sectionTitle}>เลขที่หายไปนานที่สุด</h2>
                </div>
              </div>
              <div className={styles.coldGrid}>
                {stats.cold.map((item, index) => (
                  <button key={item.num} className={styles.coldCard} onClick={() => { setQuery(item.num); setTab('analyze') }}>
                    <div className={styles.coldTopRow}>
                      <span className={styles.coldRank}>#{index + 1}</span>
                      <span className={styles.coldTap}>วิเคราะห์</span>
                    </div>
                    <div className={styles.coldNum}>{item.num}</div>
                    <div className={styles.coldGap}>{item.gap > 999 ? 'ยังไม่เคยออก' : `หาย ${item.gap} งวด`}</div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}



        {tab === 'heatmap' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>Heatmap 00-99</div>
                  <h2 className={styles.sectionTitle}>แผนที่ความน่าจับตาของเลข 2 ตัว</h2>
                </div>
              </div>
              <div className={styles.heatmapGrid}>
                {advanced.heatmap.map(item => (
                  <button
                    key={item.number}
                    className={styles.heatCell}
                    style={{ opacity: 0.42 + item.score / 16 }}
                    onClick={() => { setQuery(item.number); setTab('analyze') }}
                    title={`${item.number}: ${item.score}/10`}
                  >
                    <span>{item.number}</span>
                    <small>{item.score}</small>
                  </button>
                ))}
              </div>
              <p className={styles.caption}>สี/ความเด่นอิง Hybrid Score: Frequency + Gap + Markov + Monte Carlo</p>
            </section>
          </div>
        )}

        {tab === 'backtest' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>Strategy Backtest</div>
                  <h2 className={styles.sectionTitle}>เปรียบเทียบสูตรย้อนหลังหลายแบบ</h2>
                </div>
              </div>
              <div className={styles.strategyList}>
                {advanced.strategyBacktests.map(item => (
                  <StrategyCard key={item.label} item={item} />
                ))}
              </div>
              <p className={styles.caption}>จำลองเลือก 3 เลขต่องวด เลขละ 5 บาท จ่ายคืน 90 บาทเมื่อถูก ใช้เพื่อวัดแนวโน้มของสูตร ไม่ใช่การันตีอนาคต</p>
            </section>
          </div>
        )}

        {tab === 'ai' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>AI Insight แบบไม่ใช้ API Key</div>
                  <h2 className={styles.sectionTitle}>สรุปเหตุผลจากตัวเลขล้วน ๆ</h2>
                </div>
              </div>
              <div className={styles.insightList}>
                {advanced.aiInsights.map((text, index) => (
                  <div key={text} className={styles.insightCard}>
                    <div className={styles.insightIcon}>{index + 1}</div>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>Markov Chain</div>
                  <h2 className={styles.sectionTitle}>หลังเลขล่าสุด {advanced.markovSource} เคยตามด้วยเลขอะไร</h2>
                </div>
              </div>
              <div className={styles.markovList}>
                {advanced.markovTop.length > 0 ? advanced.markovTop.map(item => (
                  <div key={item.number} className={styles.markovRow}>
                    <span className={styles.markovNum}>{item.number}</span>
                    <div className={styles.markovTrack}><div style={{ width: `${Math.min(item.probability, 100)}%` }} /></div>
                    <span className={styles.markovProb}>{item.probability}%</span>
                  </div>
                )) : <div className={styles.empty}>ข้อมูล Markov ยังไม่พอสำหรับเลขล่าสุดนี้</div>}
              </div>
            </section>
          </div>
        )}

        {tab === 'history' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>ประวัติผล</div>
                  <h2 className={styles.sectionTitle}>ย้อนหลังล่าสุด 30 งวด</h2>
                </div>
              </div>
              <div className={styles.historyList}>
                {filtered.slice(0, 30).map((row, index) => (
                  <div key={`${row.date}-${row.lottoType}-${index}`} className={styles.historyRow}>
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


        {notification && (
          <div className={`${styles.notification} ${notification.isWin ? styles.notificationWin : styles.notificationLose}`}>
            {notification.message}
          </div>
        )}

        {tab === 'mybets' && (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.sectionKicker}>📊 สถิติของฉัน</div>
                  <h2 className={styles.sectionTitle}>บันทึกส่วนตัว เก็บในเครื่องคุณ</h2>
                </div>
              </div>
              {mounted && (
                <div className={styles.betStatsGrid}>
                  <div className={styles.betStatCard}>
                    <div className={styles.betStatValue}>{betStats.total}</div>
                    <div className={styles.betStatLabel}>ทั้งหมด</div>
                  </div>
                  <div className={styles.betStatCard}>
                    <div className={`${styles.betStatValue} ${styles.betStatWin}`}>{betStats.wins}</div>
                    <div className={styles.betStatLabel}>ถูก 🎉</div>
                  </div>
                  <div className={styles.betStatCard}>
                    <div className={`${styles.betStatValue} ${styles.betStatLose}`}>{betStats.losses}</div>
                    <div className={styles.betStatLabel}>ไม่ถูก</div>
                  </div>
                  <div className={styles.betStatCard}>
                    <div className={styles.betStatValue}>{betStats.winRate}%</div>
                    <div className={styles.betStatLabel}>แม่นยำ</div>
                  </div>
                </div>
              )}
              {mounted && betStats.total > 0 && (
                <div className={styles.betExtraStats}>
                  <span>🏆 หวยที่แม่น: <strong>{betStats.bestLotto.name}</strong> ({betStats.bestLotto.rate}%)</span>
                  <span>🔢 เลขโปรด: <strong>{betStats.topNumber}</strong></span>
                </div>
              )}
            </section>

            <MockBetForm
              lottoTypes={lottoTypes}
              getLottoName={getLottoName}
              latestResult={filtered[0]}
              onAdd={addBet}
            />

            {mounted && bets.length > 0 && (
              <section className={styles.panel}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.sectionKicker}>รายการทดลองซื้อ</div>
                    <h2 className={styles.sectionTitle}>ผลของทุกรายการ</h2>
                  </div>
                  <button className={styles.clearBtn} onClick={() => { if (confirm('ลบข้อมูลทั้งหมดใช่ไหม?')) clearAll() }}>ล้างทั้งหมด</button>
                </div>
                <div className={styles.betList}>
                  {[...bets].reverse().map(bet => (
                    <BetCard key={bet.id} bet={bet} onDelete={deleteBet} />
                  ))}
                </div>
              </section>
            )}

            {mounted && bets.length === 0 && (
              <div className={styles.emptyBets}>
                <div className={styles.emptyBetsIcon}>🎯</div>
                <div className={styles.emptyBetsTitle}>ยังไม่มีรายการ</div>
                <p>กรอกเลขที่มั่นใจด้านบน แล้วกด "บันทึก" เพื่อเริ่มติดตามผล ข้อมูลจะเก็บในเครื่องนี้เท่านั้น</p>
              </div>
            )}
          </div>
        )}

        <footer className={styles.footer}>อัปเดตอัตโนมัติทุกวัน • ออกแบบใหม่ให้อ่านง่ายและใช้งานบนมือถือสะดวกขึ้น</footer>
      </main>
    </>
  )
}

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


function AdvancedPickCard({ item, onClick }: { item: AdvancedPick; onClick: () => void }) {
  return (
    <button className={styles.candidateCard} onClick={onClick}>
      <div className={styles.candidateTop}>
        <span className={styles.candidateNum}>{item.number}</span>
        <span className={styles.scoreBadge}>{item.score}/10</span>
      </div>
      <div className={styles.candidateLevel}>Confidence {item.confidence}% • Risk {riskThai(item.risk)}</div>
      <div className={styles.candidateMeta}>Gap {item.gap} งวด • Markov {item.markovScore}/10 • MC {item.monteCarloScore}/10</div>
    </button>
  )
}

function StrategyCard({ item }: { item: StrategyBacktest }) {
  return (
    <div className={styles.strategyCard}>
      <div>
        <div className={styles.strategyName}>{item.label}</div>
        <div className={styles.strategySub}>{item.wins}/{item.rounds} งวด • Hit rate {item.hitRate}%</div>
      </div>
      <div className={styles.strategyMetrics}>
        <span className={item.profit >= 0 ? styles.profitGood : styles.profitBad}>{item.profit}</span>
        <small>ROI {item.roi}%</small>
      </div>
    </div>
  )
}

function riskThai(risk: AdvancedPick['risk']) {
  if (risk === 'low') return 'ต่ำ'
  if (risk === 'high') return 'สูง'
  return 'กลาง'
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
          <div className={styles.analysisScoreLabel}>คะแนน / 10</div>
        </div>
      </div>

      <div className={styles.analysisTag}>{analysis.level}</div>

      <div className={styles.analysisGrid}>
        <div className={styles.analysisMetric}><span>ออกทั้งหมด</span><strong>{analysis.frequencyAll} ครั้ง</strong></div>
        <div className={styles.analysisMetric}><span>ออกใน 30 งวด</span><strong>{analysis.frequency30} ครั้ง</strong></div>
        <div className={styles.analysisMetric}><span>ขาดไป</span><strong>{analysis.gap} งวด</strong></div>
        <div className={styles.analysisMetric}><span>สัญญาณโต๊ด</span><strong>{analysis.todMatches} ครั้ง</strong></div>
        {analysis.reverseNumber && (
          <div className={styles.analysisMetric}><span>เลขกลับ</span><strong>{analysis.reverseNumber}</strong></div>
        )}
        {typeof analysis.reverseFrequency === 'number' && (
          <div className={styles.analysisMetric}><span>เลขกลับออก</span><strong>{analysis.reverseFrequency} ครั้ง</strong></div>
        )}
      </div>

      <div className={styles.reasonsBox}>
        <div className={styles.reasonsTitle}>เหตุผลจากข้อมูล</div>
        <ul className={styles.reasonsList}>
          {analysis.reasons.length > 0 ? analysis.reasons.map(reason => <li key={reason}>{reason}</li>) : <li>ยังไม่มีเหตุผลเด่นพอจากข้อมูล</li>}
        </ul>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className={styles.center}>
      <div className={styles.loaderPlanet} />
      <div className={styles.centerTitle}>กำลังโหลดข้อมูล</div>
      <div className={styles.centerText}>รอสักครู่ ระบบกำลังเตรียมข้อมูลหวยให้อยู่ครับ</div>
    </div>
  )
}

function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className={styles.center}>
      <div className={styles.centerEmoji}>⚠️</div>
      <div className={styles.centerTitle}>โหลดข้อมูลไม่สำเร็จ</div>
      <div className={styles.centerText}>{msg}</div>
      <div className={styles.centerHint}>ตรวจสอบ GITHUB_CSV_URL ใน Vercel Environment Variables อีกครั้ง</div>
    </div>
  )
}

function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ─── MockBetForm ────────────────────────────────────────────────────────────
function MockBetForm({
  lottoTypes,
  getLottoName,
  latestResult,
  onAdd,
}: {
  lottoTypes: string[]
  getLottoName: (code: string) => string
  latestResult: ParsedResult | undefined
  onAdd: (bet: Omit<MockBet, 'id' | 'timestamp' | 'status'>) => void
}) {
  const [lottoCode, setLottoCode] = useState(lottoTypes[0] || '')
  const [betType, setBetType] = useState<BetType>('2ตัวล่าง')
  const [number, setNumber] = useState('')
  const [targetDate, setTargetDate] = useState('')

  // Get next expected date (simple: today or tomorrow)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const betTypes: BetType[] = ['3ตัวบน', '2ตัวล่าง', 'โต๊ด3ตัว', 'วิ่งบน', 'วิ่งล่าง']
  const maxLen = betType === '3ตัวบน' || betType === 'โต๊ด3ตัว' ? 3 : betType === 'วิ่งบน' || betType === 'วิ่งล่าง' ? 1 : 2

  const handleSubmit = () => {
    if (!number || number.length < maxLen) return
    const date = targetDate || todayStr
    onAdd({
      lottoCode,
      lottoName: getLottoName(lottoCode),
      targetDate: date,
      betType,
      number,
    })
    setNumber('')
  }

  return (
    <section className={styles.panel}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.sectionKicker}>ทดลองซื้อ</div>
          <h2 className={styles.sectionTitle}>บันทึกเลขที่มั่นใจงวดนี้</h2>
        </div>
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
          <label className={styles.betLabel}>เลือกหวย</label>
          <select
            className={styles.betSelect}
            value={lottoCode}
            onChange={e => setLottoCode(e.target.value)}
          >
            {lottoTypes.map(t => (
              <option key={t} value={t}>{getLottoName(t)}</option>
            ))}
          </select>
        </div>

        <div className={styles.betFormGroup}>
          <label className={styles.betLabel}>ประเภทการแทง</label>
          <div className={styles.betTypeRow}>
            {betTypes.map(bt => (
              <button
                key={bt}
                className={`${styles.betTypeChip} ${betType === bt ? styles.betTypeChipActive : ''}`}
                onClick={() => { setBetType(bt); setNumber('') }}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.betFormGroup}>
          <label className={styles.betLabel}>เลขที่มั่นใจ ({maxLen} ตัว)</label>
          <input
            className={styles.betNumberInput}
            value={number}
            maxLength={maxLen}
            inputMode="numeric"
            onChange={e => setNumber(e.target.value.replace(/\D/g, '').slice(0, maxLen))}
            placeholder={'0'.repeat(maxLen)}
          />
        </div>

        <div className={styles.betFormGroup}>
          <label className={styles.betLabel}>งวดที่คาดหวัง</label>
          <input
            type="date"
            className={styles.betDateInput}
            value={targetDate || todayStr}
            onChange={e => setTargetDate(e.target.value)}
          />
        </div>
      </div>

      <button
        className={styles.betSubmitBtn}
        onClick={handleSubmit}
        disabled={number.length < maxLen}
      >
        🎯 บันทึกการทดลองซื้อ
      </button>
    </section>
  )
}

// ─── BetCard ────────────────────────────────────────────────────────────────
function BetCard({ bet, onDelete }: { bet: MockBet; onDelete: (id: string) => void }) {
  const statusIcon = bet.status === 'win' ? '🎉' : bet.status === 'lose' ? '😔' : '⏳'
  const statusLabel = bet.status === 'win' ? 'ถูกรางวัล!' : bet.status === 'lose' ? 'ไม่ถูก' : 'รอผล'

  return (
    <div className={`${styles.betCard} ${styles[`betCard_${bet.status}`]}`}>
      <div className={styles.betCardTop}>
        <div className={styles.betCardLotto}>{bet.lottoName}</div>
        <div className={`${styles.betCardStatus} ${styles[`betStatus_${bet.status}`]}`}>
          {statusIcon} {statusLabel}
        </div>
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
