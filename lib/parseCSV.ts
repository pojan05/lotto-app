export interface ParsedResult {
  date: string
  lottoType: string
  top4: string
  top3: string
  bot2: string
  todKey: string
}

export interface NumberAnalysis {
  number: string
  type: '2D' | '3D'
  frequencyAll: number
  frequency30: number
  gap: number
  reverseNumber?: string
  reverseFrequency?: number
  recentHit: boolean
  todMatches: number
  score: number
  level: 'เด่นมาก' | 'น่าจับตา' | 'พอมีทรง' | 'ยังไม่เด่น'
  reasons: string[]
}

export interface LottoStats {
  bot2Counts: Record<string, number>
  top3Counts: Record<string, number>
  todCounts: Record<string, number>
  sortedBot2: [string, number][]
  sortedTop3: [string, number][]
  sortedTod: [string, number][]
  cold: { num: string; gap: number }[]
  candidates2: NumberAnalysis[]
}

export function parseCSV(text: string): ParsedResult[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const header = lines[0].replace(/^\uFEFF/, '')
  const cols = parseCSVLine(header).map(c => c.trim())

  const dateIdx = cols.findIndex(c => c.includes('วันที่'))
  const typeIdx = cols.findIndex(c => c.includes('รหัสหวย'))
  const rawIdx = cols.findIndex(c => c.includes('รางวัลทั้งหมด'))
  const top4Idx = cols.findIndex(c => c.includes('4ตัวบน'))
  const top3Idx = cols.findIndex(c => c.includes('3ตัวบน'))
  const bot2Idx = cols.findIndex(c => c.includes('2ตัวล่าง'))

  const results: ParsedResult[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCSVLine(line)

    let top3 = top3Idx >= 0 ? (fields[top3Idx] || '').trim() : ''
    let bot2 = bot2Idx >= 0 ? (fields[bot2Idx] || '').trim() : ''
    let top4 = top4Idx >= 0 ? (fields[top4Idx] || '').trim() : ''

    if ((!top3 || !bot2 || !top4) && rawIdx >= 0) {
      const raw = fields[rawIdx] || ''
      const b3 = raw.match(/'B3':\s*'([^']+)'/)?.[1] || raw.match(/"B3":\s*"([^"]+)"/)?.[1] || ''
      const b2 = raw.match(/'B2':\s*'([^']+)'/)?.[1] || raw.match(/"B2":\s*"([^"]+)"/)?.[1] || ''
      const l2 = raw.match(/'L2':\s*'([^']+)'/)?.[1] || raw.match(/"L2":\s*"([^"]+)"/)?.[1] || ''
      const b4 = raw.match(/'B4':\s*'([^']+)'/)?.[1] || raw.match(/"B4":\s*"([^"]+)"/)?.[1] || ''
      if (!top3) top3 = b3
      if (!bot2) bot2 = b2 || l2
      if (!top4) top4 = b4
    }

    const todKey = top3.length === 3 && /^\d{3}$/.test(top3)
      ? top3.split('').sort().join('')
      : ''

    results.push({
      date: dateIdx >= 0 ? (fields[dateIdx] || '').trim() : '',
      lottoType: typeIdx >= 0 ? (fields[typeIdx] || '').trim() : '',
      top4,
      top3,
      bot2,
      todKey,
    })
  }

  return results.filter(r => r.lottoType)
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i += 1 }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export const LOTTO_NAMES: Record<string, string> = {
  GLO: '🇹🇭 หวยรัฐบาลไทย', BAAC: '🌾 ธ.ก.ส.', GSB: '🏦 ออมสิน',
  SET: '📈 หุ้นไทย SET', KTOP30: '📊 หุ้นไทย K-Top30', KTOPVIP: '📊 หุ้นไทย K-Top VIP',
  DAX: '🇩🇪 หุ้นเยอรมัน DAX', DJI: '🇺🇸 ดาวโจนส์', DJIVIP: '🇺🇸 ดาวโจนส์ VIP',
  BSE: '🇮🇳 หุ้นอินเดีย', EGX30: '🇪🇬 หุ้นอียิปต์',
  HSI_1: '🇭🇰 ฮั่งเส็ง รอบ 1', HSI_2: '🇭🇰 ฮั่งเส็ง รอบ 2',
  HSIVIP_1: '🇭🇰 ฮั่งเส็ง VIP รอบ 1', HSIVIP_2: '🇭🇰 ฮั่งเส็ง VIP รอบ 2',
  NKY_1: '🇯🇵 นิเคอิ รอบ 1', NKY_2: '🇯🇵 นิเคอิ รอบ 2',
  NKYVIP_1: '🇯🇵 นิเคอิ VIP รอบ 1', NKYVIP_2: '🇯🇵 นิเคอิ VIP รอบ 2',
  STI: '🇸🇬 หุ้นสิงคโปร์', STIVIP: '🇸🇬 หุ้นสิงคโปร์ VIP',
  SZSE_1: '🇨🇳 หุ้นจีน เซินเจิ้น รอบ 1', SZSE_2: '🇨🇳 หุ้นจีน เซินเจิ้น รอบ 2',
  SZSEVIP_1: '🇨🇳 หุ้นจีน เซินเจิ้น VIP รอบ 1', SZSEVIP_2: '🇨🇳 หุ้นจีน เซินเจิ้น VIP รอบ 2',
  TAIEX: '🇹🇼 หุ้นไต้หวัน', TAIEXCIP: '🇹🇼 หุ้นไต้หวัน CIP',
  UKX: '🇬🇧 หุ้นอังกฤษ FTSE', UKXVIP: '🇬🇧 หุ้นอังกฤษ VIP',
  MOEX: '🇷🇺 หุ้นรัสเซีย', LOEX: '🌍 หุ้น LOEX',
  LATV: '🇱🇦 หวยลาว TV', LAVIP: '🇱🇦 หวยลาว VIP', LAHD: '🇱🇦 หวยลาว HD',
  LASMK: '🇱🇦 หวยลาว SMK', LASTR: '🇱🇦 หวยลาว Star', LASTRVIP: '🇱🇦 หวยลาว Star VIP',
  LATK5D: '🇱🇦 หวยลาว TK 5D', LATKVIP: '🇱🇦 หวยลาว TK VIP', LALOT: '🇱🇦 หวยลาว Lot',
  Laaoo: '🇱🇦 หวยลาว', VNLOT: '🇻🇳 หวยเวียดนาม Lot', VNSTR: '🇻🇳 หวยเวียดนาม Star',
  VNTV: '🇻🇳 หวยเวียดนาม TV', VNVIP: '🇻🇳 หวยเวียดนาม VIP', VNAS: '🇻🇳 หวยเวียดนาม AS',
  VNEXT: '🇻🇳 หวยเวียดนาม EXT', VNHD: '🇻🇳 หวยเวียดนาม HD', VNKCH: '🇻🇳 หวยเวียดนาม KCH',
  VNPTN: '🇻🇳 หวยเวียดนาม PTN', VNSPC_2: '🇻🇳 หวยเวียดนาม SPC รอบ 2', VNSPCb: '🇻🇳 หวยเวียดนาม SPC B',
  GRAND_DRAGON_4D: '🐉 Grand Dragon 4D', MAGNUM: '🇲🇾 Magnum', MAGNUM_4D: '🇲🇾 Magnum 4D',
  SINGAPORE_4D: '🇸🇬 สิงคโปร์ 4D',
  // Lao Extra
  LAO_EXTRA: '🇱🇦 หวยลาว EXTRA',
}

export function getLottoName(code: string): string {
  if (LOTTO_NAMES[code]) return LOTTO_NAMES[code]
  if (code.startsWith('LV_R')) return `🎰 หุ้น รอบ ${code.replace('LV_R', '')}`
  return code
}

const ALL_2D = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))

export function getStats(rows: ParsedResult[]): LottoStats {
  const n = rows.length
  const bot2Counts: Record<string, number> = {}
  const top3Counts: Record<string, number> = {}
  const todCounts: Record<string, number> = {}

  for (const r of rows) {
    if (/^\d{2}$/.test(r.bot2)) bot2Counts[r.bot2] = (bot2Counts[r.bot2] || 0) + 1
    if (/^\d{3}$/.test(r.top3)) top3Counts[r.top3] = (top3Counts[r.top3] || 0) + 1
    if (r.todKey) todCounts[r.todKey] = (todCounts[r.todKey] || 0) + 1
  }

  const sortedBot2 = Object.entries(bot2Counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const sortedTop3 = Object.entries(top3Counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const sortedTod = Object.entries(todCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12)

  // cold: ใช้ n (จำนวนงวดที่มีจริง) ไม่ใช่ constant 100
  const bot2List = rows.map(r => r.bot2).filter(v => /^\d{2}$/.test(v))
  const cold = ALL_2D
    .map(num => {
      const idx = bot2List.indexOf(num)
      return { num, gap: idx === -1 ? n + 99 : idx }
    })
    .filter(item => item.gap > 0) // ต้องไม่ใช่งวดล่าสุด
    .sort((a, b) => b.gap - a.gap || a.num.localeCompare(b.num))
    .slice(0, 12)

  const candidates2 = ALL_2D
    .map(num => analyze2D(rows, num))
    .sort((a, b) => b.score - a.score || b.gap - a.gap || a.number.localeCompare(b.number))
    .slice(0, 12)

  return { bot2Counts, top3Counts, todCounts, sortedBot2, sortedTop3, sortedTod, cold, candidates2 }
}

export function analyzeNumber(rows: ParsedResult[], inputRaw: string): NumberAnalysis | null {
  const input = inputRaw.trim()
  if (!/^\d{2,3}$/.test(input)) return null
  return input.length === 2 ? analyze2D(rows, input) : analyze3D(rows, input)
}

function analyze2D(rows: ParsedResult[], num: string): NumberAnalysis {
  const bot2List = rows.map(r => r.bot2).filter(v => /^\d{2}$/.test(v))
  const n = bot2List.length
  const last30 = bot2List.slice(0, Math.min(30, n))
  const frequencyAll = bot2List.filter(v => v === num).length
  const frequency30 = last30.filter(v => v === num).length
  const gap = bot2List.indexOf(num) // -1 = ไม่เคยออก, 0 = งวดล่าสุด
  const reverseNumber = num.split('').reverse().join('')
  const reverseFrequency = bot2List.filter(v => v === reverseNumber).length
  const recentHit = bot2List.slice(0, 5).includes(num)

  let todMatches = 0
  for (const row of rows.slice(0, Math.min(30, n))) {
    if (row.top3.includes(num[0]) && row.top3.includes(num[1])) todMatches++
  }

  let score = 0
  const reasons: string[] = []
  const gapVal = gap === -1 ? n + 5 : gap

  score += Math.min(frequency30 * 1.8, 3)
  if (frequency30 > 0) reasons.push(`ออกใน ${Math.min(30, n)} งวดล่าสุด ${frequency30} ครั้ง`)

  if (gapVal >= 8) { score += 3; reasons.push(`ขาดไป ${gapVal} งวด`) }
  else if (gapVal >= 4) { score += 2; reasons.push(`ห่างมา ${gapVal} งวด`) }
  else if (gapVal >= 1) { score += 0.8; reasons.push(`เพิ่งหาย ${gapVal} งวด`) }

  if (recentHit) { score -= 1.5; reasons.push('เพิ่งออกใน 5 งวดล่าสุด') }

  if (num !== reverseNumber && reverseFrequency >= 2) {
    score += 1; reasons.push(`เลขกลับ ${reverseNumber} ออก ${reverseFrequency} ครั้ง`)
  }
  if (todMatches >= 2) { score += 1.2; reasons.push(`เชื่อมโยงโต๊ด ${todMatches} ครั้ง`) }

  return {
    number: num, type: '2D',
    frequencyAll, frequency30,
    gap: gap === -1 ? n : gap,
    reverseNumber, reverseFrequency,
    recentHit, todMatches,
    score: round1(clamp(score, 0, 10)),
    level: getLevel(score),
    reasons,
  }
}

function analyze3D(rows: ParsedResult[], num: string): NumberAnalysis {
  const top3List = rows.map(r => r.top3).filter(v => /^\d{3}$/.test(v))
  const n = top3List.length
  const last30 = top3List.slice(0, Math.min(30, n))
  const frequencyAll = top3List.filter(v => v === num).length
  const frequency30 = last30.filter(v => v === num).length
  const gap = top3List.indexOf(num)
  const key = num.split('').sort().join('')
  const todMatches = rows.slice(0, Math.min(30, n)).filter(r => r.todKey === key).length
  const recentHit = top3List.slice(0, 8).includes(num)

  let score = 0
  const reasons: string[] = []
  const gapVal = gap === -1 ? n + 5 : gap

  score += Math.min(frequency30 * 2, 2.5)
  if (frequency30 > 0) reasons.push(`ออกใน ${Math.min(30, n)} งวดล่าสุด ${frequency30} ครั้ง`)

  if (gapVal >= 10) { score += 3.2; reasons.push(`ขาดไป ${gapVal} งวด`) }
  else if (gapVal >= 5) { score += 2.1; reasons.push(`ห่างมา ${gapVal} งวด`) }

  if (todMatches >= 2) { score += 2.4; reasons.push(`โต๊ดชุด ${key} พบ ${todMatches} ครั้ง`) }
  if (recentHit) { score -= 1.5; reasons.push('เพิ่งออกในช่วงนี้') }

  return {
    number: num, type: '3D',
    frequencyAll, frequency30,
    gap: gap === -1 ? n : gap,
    recentHit, todMatches,
    score: round1(clamp(score, 0, 10)),
    level: getLevel(score),
    reasons,
  }
}

export function getQuickBacktest(rows: ParsedResult[]) {
  const validRows = rows.filter(r => /^\d{2}$/.test(r.bot2))
  const n = validRows.length
  if (n < 8) return { rounds: n, picksPerRound: 0, wins: 0, spent: 0, returned: 0, profit: 0, roi: 0, hitRate: 0 }

  let wins = 0; let spent = 0; let returned = 0
  const picksPerRound = 3

  for (let i = n - 2; i >= 0; i--) {
    const history = validRows.slice(i + 1)
    const picks = ALL_2D
      .map(num => analyze2D(history, num))
      .sort((a, b) => b.score - a.score || b.gap - a.gap)
      .slice(0, picksPerRound)
      .map(x => x.number)
    spent += picksPerRound * 5
    if (picks.includes(validRows[i].bot2)) { wins++; returned += 90 }
  }

  const rounds = n - 1
  const profit = returned - spent
  return { rounds, picksPerRound, wins, spent, returned, profit, roi: round1(spent > 0 ? (profit / spent) * 100 : 0), hitRate: round1(rounds > 0 ? (wins / rounds) * 100 : 0) }
}

export interface AdvancedPick {
  number: string; score: number; confidence: number; baseScore: number
  markovScore: number; monteCarloScore: number; frequency30: number; gap: number
  risk: 'low' | 'medium' | 'high'; reasons: string[]
}

export interface StrategyBacktest {
  strategy: string; label: string; rounds: number; wins: number
  hitRate: number; spent: number; returned: number; profit: number; roi: number
}

export interface AdvancedAnalytics {
  picks: AdvancedPick[]; heatmap: AdvancedPick[]
  markovSource: string; markovTop: { number: string; probability: number; count: number }[]
  monteCarloRuns: number; strategyBacktests: StrategyBacktest[]; aiInsights: string[]
}

export function getAdvancedAnalytics(rows: ParsedResult[]): AdvancedAnalytics {
  const cleanRows = rows.filter(r => /^\d{2}$/.test(r.bot2))
  const n = cleanRows.length
  const bot2List = cleanRows.map(r => r.bot2)
  const latest = bot2List[0] || '--'
  const markov = buildMarkov(cleanRows)
  const markovMap = markov.transitions[latest] || {}
  const markovTotal = Object.values(markovMap).reduce((s, v) => s + v, 0)

  // Monte Carlo runs ปรับตาม data size เพื่อความเร็ว
  const mcRuns = n < 30 ? 5000 : n < 100 ? 15000 : 30000
  const monteCarlo = runMonteCarlo(cleanRows, markovMap, markovTotal, mcRuns)

  const heatmap = ALL_2D.map(num => {
    const base = analyze2D(cleanRows, num)
    const markovP = markovTotal > 0 ? (markovMap[num] || 0) / markovTotal : 0
    const markovScore = clamp(markovP * 100, 0, 10)
    const mcP = monteCarlo.probability[num] || 0
    const monteCarloScore = clamp(mcP * 100, 0, 10)
    const gapPressure = clamp(base.gap / 12, 0, 2)
    const combined = clamp((base.score * 0.48) + (markovScore * 0.24) + (monteCarloScore * 0.18) + gapPressure, 0, 10)
    const risk = getRiskLevel(base, combined)
    const confidence = clamp((combined * 7.5) + (base.frequency30 * 3) + (markovP * 100), 0, 99)
    const reasons = buildAdvancedReasons(base, markovP, mcP, combined, risk)
    return { number: num, score: round1(combined), confidence: round1(confidence), baseScore: base.score, markovScore: round1(markovScore), monteCarloScore: round1(monteCarloScore), frequency30: base.frequency30, gap: base.gap, risk, reasons }
  })

  const sortedHeatmap = [...heatmap].sort((a, b) => b.score - a.score || b.confidence - a.confidence || b.gap - a.gap || a.number.localeCompare(b.number))

  const markovTop = Object.entries(markovMap)
    .map(([number, count]) => ({ number, count, probability: markovTotal > 0 ? round1((count / markovTotal) * 100) : 0 }))
    .sort((a, b) => b.probability - a.probability || a.number.localeCompare(b.number))
    .slice(0, 10)

  // ทำ strategy backtest เฉพาะถ้ามีข้อมูลพอ
  const strategyBacktests = n >= 10 ? getStrategyBacktests(cleanRows) : []
  const aiInsights = buildAiInsights(sortedHeatmap, markovTop, strategyBacktests, latest, n)

  return { picks: sortedHeatmap.slice(0, 12), heatmap, markovSource: latest, markovTop, monteCarloRuns: mcRuns, strategyBacktests, aiInsights }
}

function buildMarkov(rowsDesc: ParsedResult[]) {
  const transitions: Record<string, Record<string, number>> = {}
  const asc = [...rowsDesc].reverse()
  for (let i = 1; i < asc.length; i++) {
    const prev = asc[i - 1].bot2; const next = asc[i].bot2
    if (!/^\d{2}$/.test(prev) || !/^\d{2}$/.test(next)) continue
    transitions[prev] ||= {}
    transitions[prev][next] = (transitions[prev][next] || 0) + 1
  }
  return { transitions }
}

function runMonteCarlo(rowsDesc: ParsedResult[], markovMap: Record<string, number>, markovTotal: number, runs: number) {
  const weights = ALL_2D.map(num => {
    const base = analyze2D(rowsDesc, num)
    const boost = markovTotal > 0 ? ((markovMap[num] || 0) / markovTotal) * 18 : 0
    return Math.max(0.25, 1 + base.score + boost + (base.recentHit ? -1.4 : 0))
  })
  const totalW = weights.reduce((s, v) => s + v, 0)
  const cumulative: number[] = []
  weights.reduce((s, v, i) => { const n = s + v; cumulative[i] = n; return n }, 0)

  const counts: Record<string, number> = {}
  let seed = rowsDesc.slice(0, 8).map(r => Number(r.bot2) || 0).reduce((s, v) => s + v * 17, 7919)
  for (let i = 0; i < runs; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    const target = (seed / 4294967296) * totalW
    const idx = cumulative.findIndex(v => v >= target)
    const num = ALL_2D[idx === -1 ? ALL_2D.length - 1 : idx]
    counts[num] = (counts[num] || 0) + 1
  }
  const probability: Record<string, number> = {}
  for (const num of ALL_2D) probability[num] = (counts[num] || 0) / runs
  return { counts, probability, runs }
}

function getRiskLevel(base: NumberAnalysis, combined: number): AdvancedPick['risk'] {
  if (base.recentHit || (base.frequency30 >= 4 && base.gap <= 2)) return 'high'
  if (combined >= 7 && base.gap >= 4) return 'low'
  return 'medium'
}

function buildAdvancedReasons(base: NumberAnalysis, markovP: number, mcP: number, combined: number, risk: AdvancedPick['risk']) {
  const reasons = [...base.reasons]
  if (markovP > 0) reasons.push(`Markov ${round1(markovP * 100)}%`)
  if (mcP > 0.015) reasons.push(`Monte Carlo ${round1(mcP * 100)}%`)
  if (combined >= 7) reasons.push('คะแนน Hybrid สูง')
  if (risk === 'high') reasons.push('ความเสี่ยงสูง — เพิ่งออกหรือถูกไล่')
  if (risk === 'low') reasons.push('ความเสี่ยงต่ำ — คะแนนสูงและไม่เพิ่งออก')
  return reasons.slice(0, 5)
}

type PickFn = (h: ParsedResult[], picks: number) => string[]

function getStrategyBacktests(rowsDesc: ParsedResult[]): StrategyBacktest[] {
  return [
    { key: 'hot', label: 'เลขร้อน', pick: pickHot },
    { key: 'cold', label: 'เลขอั้น', pick: pickCold },
    { key: 'hybrid', label: 'Hybrid Score', pick: pickHybrid },
    { key: 'markov', label: 'Markov+Gap', pick: pickMarkovGap },
    { key: 'monte', label: 'Monte Carlo', pick: pickMonteCarlo },
  ].map(s => runStrategyBacktest(rowsDesc, s.label, s.pick))
}

function runStrategyBacktest(rowsDesc: ParsedResult[], label: string, pickFn: PickFn): StrategyBacktest {
  const valid = rowsDesc.filter(r => /^\d{2}$/.test(r.bot2))
  const n = valid.length
  if (n < 8) return { strategy: label, label, rounds: n, wins: 0, hitRate: 0, spent: 0, returned: 0, profit: 0, roi: 0 }
  let wins = 0; let spent = 0; let returned = 0
  for (let i = n - 2; i >= 0; i--) {
    const history = valid.slice(i + 1)
    const picks = pickFn(history, 3)
    spent += 15
    if (picks.includes(valid[i].bot2)) { wins++; returned += 90 }
  }
  const rounds = n - 1
  const profit = returned - spent
  return { strategy: label, label, rounds, wins, hitRate: round1((wins / rounds) * 100), spent, returned, profit, roi: spent > 0 ? round1((profit / spent) * 100) : 0 }
}

function pickHot(h: ParsedResult[], picks: number) {
  const c: Record<string, number> = {}
  for (const r of h.slice(0, 60)) c[r.bot2] = (c[r.bot2] || 0) + 1
  return ALL_2D.sort((a, b) => (c[b] || 0) - (c[a] || 0) || a.localeCompare(b)).slice(0, picks)
}
function pickCold(h: ParsedResult[], picks: number) {
  const list = h.map(r => r.bot2)
  return ALL_2D.map(num => ({ num, gap: list.indexOf(num) === -1 ? list.length + 99 : list.indexOf(num) }))
    .sort((a, b) => b.gap - a.gap || a.num.localeCompare(b.num)).slice(0, picks).map(x => x.num)
}
function pickHybrid(h: ParsedResult[], picks: number) {
  return ALL_2D.map(num => analyze2D(h, num)).sort((a, b) => b.score - a.score || b.gap - a.gap || a.number.localeCompare(b.number)).slice(0, picks).map(x => x.number)
}
function pickMarkovGap(h: ParsedResult[], picks: number) {
  const latest = h[0]?.bot2 || '--'
  const markov = buildMarkov(h)
  const map = markov.transitions[latest] || {}
  const total = Object.values(map).reduce((s, v) => s + v, 0)
  return ALL_2D.map(num => { const base = analyze2D(h, num); const p = total > 0 ? (map[num] || 0) / total : 0; return { num, score: base.score + p * 12 + clamp(base.gap / 10, 0, 2) } })
    .sort((a, b) => b.score - a.score || a.num.localeCompare(b.num)).slice(0, picks).map(x => x.num)
}
function pickMonteCarlo(h: ParsedResult[], picks: number) {
  const latest = h[0]?.bot2 || '--'
  const markov = buildMarkov(h)
  const map = markov.transitions[latest] || {}
  const total = Object.values(map).reduce((s, v) => s + v, 0)
  const mc = runMonteCarlo(h, map, total, 8000)
  return ALL_2D.sort((a, b) => (mc.probability[b] || 0) - (mc.probability[a] || 0) || a.localeCompare(b)).slice(0, picks)
}

function buildAiInsights(picks: AdvancedPick[], markovTop: { number: string; probability: number }[], backtests: StrategyBacktest[], latest: string, n: number) {
  const best = [...backtests].sort((a, b) => b.roi - a.roi)[0]
  const insights: string[] = []
  if (picks[0]) insights.push(`เลข ${picks[0].number} — คะแนน ${picks[0].score}/10, ขาด ${picks[0].gap} งวด, Confidence ${picks[0].confidence}%`)
  if (picks[1]) insights.push(`เลขสำรอง ${picks[1].number} — คะแนน ${picks[1].score}/10, ใช้กระจายความเสี่ยง`)
  if (markovTop[0]) insights.push(`Markov จากงวดล่าสุด ${latest} → เลขถัดไปที่น่าจับตา: ${markovTop[0].number} (${markovTop[0].probability}%)`)
  if (best) insights.push(`สูตรที่ดีสุดจาก Backtest: ${best.label} — Hit rate ${best.hitRate}% / ROI ${best.roi}%`)
  if (n < 30) insights.push(`⚠️ ข้อมูลมีแค่ ${n} งวด ยิ่งมีมากยิ่งแม่น`)
  insights.push('⚠️ ระบบนี้ใช้คัดกรองจากสถิติเท่านั้น ไม่ใช่การันตีผล')
  return insights
}

function getLevel(score: number): NumberAnalysis['level'] {
  if (score >= 7.5) return 'เด่นมาก'
  if (score >= 6) return 'น่าจับตา'
  if (score >= 4) return 'พอมีทรง'
  return 'ยังไม่เด่น'
}
function round1(n: number) { return Math.round(n * 10) / 10 }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
