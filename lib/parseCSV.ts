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
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export const LOTTO_NAMES: Record<string, string> = {
  GLO: '🇹🇭 หวยรัฐบาลไทย',
  BAAC: '🌾 ธ.ก.ส.',
  GSB: '🏦 ออมสิน',
  SET: '📈 หุ้นไทย (SET)',
  KTOP30: '📊 หุ้นไทย K-Top30',
  KTOPVIP: '📊 หุ้นไทย K-Top VIP',
  DAX: '🇩🇪 หุ้นเยอรมัน (DAX)',
  DJI: '🇺🇸 ดาวโจนส์ (DJI)',
  DJIVIP: '🇺🇸 ดาวโจนส์ VIP',
  BSE: '🇮🇳 หุ้นอินเดีย (BSE)',
  EGX30: '🇪🇬 หุ้นอียิปต์ (EGX30)',
  HSI_1: '🇭🇰 ฮั่งเส็ง รอบ 1',
  HSI_2: '🇭🇰 ฮั่งเส็ง รอบ 2',
  HSIVIP_1: '🇭🇰 ฮั่งเส็ง VIP รอบ 1',
  HSIVIP_2: '🇭🇰 ฮั่งเส็ง VIP รอบ 2',
  NKY_1: '🇯🇵 นิเคอิ รอบ 1',
  NKY_2: '🇯🇵 นิเคอิ รอบ 2',
  NKYVIP_1: '🇯🇵 นิเคอิ VIP รอบ 1',
  NKYVIP_2: '🇯🇵 นิเคอิ VIP รอบ 2',
  STI: '🇸🇬 หุ้นสิงคโปร์ (STI)',
  STIVIP: '🇸🇬 หุ้นสิงคโปร์ VIP',
  SZSE_1: '🇨🇳 หุ้นจีน เซินเจิ้น รอบ 1',
  SZSE_2: '🇨🇳 หุ้นจีน เซินเจิ้น รอบ 2',
  SZSEVIP_1: '🇨🇳 หุ้นจีน เซินเจิ้น VIP รอบ 1',
  SZSEVIP_2: '🇨🇳 หุ้นจีน เซินเจิ้น VIP รอบ 2',
  TAIEX: '🇹🇼 หุ้นไต้หวัน (TAIEX)',
  TAIEXCIP: '🇹🇼 หุ้นไต้หวัน CIP',
  UKX: '🇬🇧 หุ้นอังกฤษ (FTSE)',
  UKXVIP: '🇬🇧 หุ้นอังกฤษ VIP',
  MOEX: '🇷🇺 หุ้นรัสเซีย (MOEX)',
  LOEX: '🌍 หุ้น LOEX',
  LATV: '🇱🇦 หวยลาว TV',
  LAVIP: '🇱🇦 หวยลาว VIP',
  LAHD: '🇱🇦 หวยลาว HD',
  LASMK: '🇱🇦 หวยลาว SMK',
  LASTR: '🇱🇦 หวยลาว Star',
  LASTRVIP: '🇱🇦 หวยลาว Star VIP',
  LATK5D: '🇱🇦 หวยลาว TK 5D',
  LATKVIP: '🇱🇦 หวยลาว TK VIP',
  LALOT: '🇱🇦 หวยลาว Lot',
  Laaoo: '🇱🇦 หวยลาว',
  VNLOT: '🇻🇳 หวยเวียดนาม Lot',
  VNSTR: '🇻🇳 หวยเวียดนาม Star',
  VNTV: '🇻🇳 หวยเวียดนาม TV',
  VNVIP: '🇻🇳 หวยเวียดนาม VIP',
  VNAS: '🇻🇳 หวยเวียดนาม AS',
  VNEXT: '🇻🇳 หวยเวียดนาม EXT',
  VNHD: '🇻🇳 หวยเวียดนาม HD',
  VNKCH: '🇻🇳 หวยเวียดนาม KCH',
  VNPTN: '🇻🇳 หวยเวียดนาม PTN',
  VNSPC_2: '🇻🇳 หวยเวียดนาม SPC รอบ 2',
  VNSPCb: '🇻🇳 หวยเวียดนาม SPC B',
  GRAND_DRAGON_4D: '🐉 Grand Dragon 4D',
  MAGNUM: '🇲🇾 หวยมาเลย์ Magnum',
  MAGNUM_4D: '🇲🇾 หวยมาเลย์ Magnum 4D',
  SINGAPORE_4D: '🇸🇬 หวยสิงคโปร์ 4D',
}

export function getLottoName(code: string): string {
  if (LOTTO_NAMES[code]) return LOTTO_NAMES[code]
  if (code.startsWith('LV_R')) return `🎰 หวยหุ้น รอบ ${code.replace('LV_R', '')}`
  return code
}

export function getStats(rows: ParsedResult[]): LottoStats {
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

  const bot2List = rows.map(r => r.bot2).filter(v => /^\d{2}$/.test(v))
  const allNums = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))
  const cold = allNums
    .map(num => {
      const idx = bot2List.indexOf(num)
      return { num, gap: idx === -1 ? bot2List.length + 999 : idx }
    })
    .sort((a, b) => b.gap - a.gap || a.num.localeCompare(b.num))
    .slice(0, 12)

  const candidates2 = allNums
    .map(num => analyze2D(rows, num))
    .sort((a, b) => b.score - a.score || b.frequency30 - a.frequency30 || b.gap - a.gap || a.number.localeCompare(b.number))
    .slice(0, 12)

  return {
    bot2Counts,
    top3Counts,
    todCounts,
    sortedBot2,
    sortedTop3,
    sortedTod,
    cold,
    candidates2,
  }
}

export function analyzeNumber(rows: ParsedResult[], inputRaw: string): NumberAnalysis | null {
  const input = inputRaw.trim()
  if (!/^\d{2,3}$/.test(input)) return null

  if (input.length === 2) {
    return analyze2D(rows, input)
  }

  return analyze3D(rows, input)
}

function analyze2D(rows: ParsedResult[], num: string): NumberAnalysis {
  const bot2List = rows.map(r => r.bot2).filter(v => /^\d{2}$/.test(v))
  const last30 = bot2List.slice(0, 30)
  const frequencyAll = bot2List.filter(v => v === num).length
  const frequency30 = last30.filter(v => v === num).length
  const gap = bot2List.indexOf(num)
  const reverseNumber = num.split('').reverse().join('')
  const reverseFrequency = bot2List.filter(v => v === reverseNumber).length
  const recentHit = bot2List.slice(0, 5).includes(num)

  let todMatches = 0
  for (const row of rows.slice(0, 30)) {
    if (row.top3.includes(num[0]) && row.top3.includes(num[1])) {
      todMatches += 1
    }
  }

  let score = 0
  const reasons: string[] = []

  score += Math.min(frequency30 * 1.8, 3)
  if (frequency30 > 0) reasons.push(`ออกใน 30 งวดล่าสุด ${frequency30} ครั้ง`)

  const gapValue = gap === -1 ? bot2List.length + 5 : gap
  if (gapValue >= 8) {
    score += 3
    reasons.push(`ขาดไป ${gapValue} งวด`)
  } else if (gapValue >= 4) {
    score += 2
    reasons.push(`ห่างจากงวดล่าสุด ${gapValue} งวด`)
  } else if (gapValue >= 1) {
    score += 0.8
    reasons.push(`เพิ่งหายไป ${gapValue} งวด`)
  }

  if (recentHit) {
    score -= 1.5
    reasons.push('เพิ่งออกในช่วง 5 งวดล่าสุด')
  }

  if (reverseFrequency >= 2) {
    score += 1
    reasons.push(`เลขกลับ ${reverseNumber} เคยออก ${reverseFrequency} ครั้ง`)
  }

  if (todMatches >= 2) {
    score += 1.2
    reasons.push(`มีความเชื่อมโยงกับโต๊ดใน 30 งวดล่าสุด ${todMatches} ครั้ง`)
  }

  score = clamp(score, 0, 10)

  return {
    number: num,
    type: '2D',
    frequencyAll,
    frequency30,
    gap: gap === -1 ? bot2List.length : gap,
    reverseNumber,
    reverseFrequency,
    recentHit,
    todMatches,
    score: round1(score),
    level: getLevel(score),
    reasons,
  }
}

function analyze3D(rows: ParsedResult[], num: string): NumberAnalysis {
  const top3List = rows.map(r => r.top3).filter(v => /^\d{3}$/.test(v))
  const last30 = top3List.slice(0, 30)
  const frequencyAll = top3List.filter(v => v === num).length
  const frequency30 = last30.filter(v => v === num).length
  const gap = top3List.indexOf(num)
  const key = num.split('').sort().join('')
  const todMatches = rows.slice(0, 30).filter(r => r.todKey === key).length
  const recentHit = top3List.slice(0, 8).includes(num)

  let score = 0
  const reasons: string[] = []

  score += Math.min(frequency30 * 2, 2.5)
  if (frequency30 > 0) reasons.push(`ออกใน 30 งวดล่าสุด ${frequency30} ครั้ง`)

  const gapValue = gap === -1 ? top3List.length + 5 : gap
  if (gapValue >= 10) {
    score += 3.2
    reasons.push(`ขาดไป ${gapValue} งวด`)
  } else if (gapValue >= 5) {
    score += 2.1
    reasons.push(`ห่างจากงวดล่าสุด ${gapValue} งวด`)
  }

  if (todMatches >= 2) {
    score += 2.4
    reasons.push(`โต๊ดชุด ${key} พบ ${todMatches} ครั้งใน 30 งวดล่าสุด`)
  }

  if (recentHit) {
    score -= 1.5
    reasons.push('เพิ่งออกในช่วงใกล้ ๆ นี้')
  }

  score = clamp(score, 0, 10)

  return {
    number: num,
    type: '3D',
    frequencyAll,
    frequency30,
    gap: gap === -1 ? top3List.length : gap,
    recentHit,
    todMatches,
    score: round1(score),
    level: getLevel(score),
    reasons,
  }
}

export function getQuickBacktest(rows: ParsedResult[]) {
  const validRows = rows.filter(r => /^\d{2}$/.test(r.bot2))
  if (validRows.length < 12) {
    return {
      rounds: validRows.length,
      picksPerRound: 0,
      wins: 0,
      spent: 0,
      returned: 0,
      profit: 0,
      roi: 0,
      hitRate: 0,
    }
  }

  let wins = 0
  let spent = 0
  let returned = 0
  const picksPerRound = 3

  for (let i = validRows.length - 2; i >= 0; i--) {
    const history = validRows.slice(i + 1)
    const ranked = Array.from({ length: 100 }, (_, n) => n.toString().padStart(2, '0'))
      .map(num => analyze2D(history, num))
      .sort((a, b) => b.score - a.score || b.frequency30 - a.frequency30 || b.gap - a.gap)
      .slice(0, picksPerRound)
      .map(item => item.number)

    spent += picksPerRound * 5
    if (ranked.includes(validRows[i].bot2)) {
      wins += 1
      returned += 90
    }
  }

  const rounds = Math.max(validRows.length - 1, 0)
  const profit = returned - spent
  const roi = spent > 0 ? (profit / spent) * 100 : 0
  const hitRate = rounds > 0 ? (wins / rounds) * 100 : 0

  return {
    rounds,
    picksPerRound,
    wins,
    spent,
    returned,
    profit,
    roi: round1(roi),
    hitRate: round1(hitRate),
  }
}

function getLevel(score: number): NumberAnalysis['level'] {
  if (score >= 7.5) return 'เด่นมาก'
  if (score >= 6) return 'น่าจับตา'
  if (score >= 4) return 'พอมีทรง'
  return 'ยังไม่เด่น'
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export interface AdvancedPick {
  number: string
  score: number
  confidence: number
  baseScore: number
  markovScore: number
  monteCarloScore: number
  frequency30: number
  gap: number
  risk: 'low' | 'medium' | 'high'
  reasons: string[]
}

export interface StrategyBacktest {
  strategy: string
  label: string
  rounds: number
  wins: number
  hitRate: number
  spent: number
  returned: number
  profit: number
  roi: number
}

export interface AdvancedAnalytics {
  picks: AdvancedPick[]
  heatmap: AdvancedPick[]
  markovSource: string
  markovTop: { number: string; probability: number; count: number }[]
  monteCarloRuns: number
  strategyBacktests: StrategyBacktest[]
  aiInsights: string[]
}

const ALL_2D = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))

export function getAdvancedAnalytics(rows: ParsedResult[]): AdvancedAnalytics {
  const cleanRows = rows.filter(r => /^\d{2}$/.test(r.bot2))
  const bot2List = cleanRows.map(r => r.bot2)
  const latest = bot2List[0] || '--'
  const markov = buildMarkov(cleanRows)
  const markovMap = markov.transitions[latest] || {}
  const markovTotal = Object.values(markovMap).reduce((sum, value) => sum + value, 0)
  const monteCarlo = runMonteCarlo(cleanRows, markovMap, markovTotal, 50000)

  const heatmap = ALL_2D.map(num => {
    const base = analyze2D(cleanRows, num)
    const markovProbability = markovTotal > 0 ? (markovMap[num] || 0) / markovTotal : 0
    const markovScore = clamp(markovProbability * 100, 0, 10)
    const monteCarloProbability = monteCarlo.probability[num] || 0
    const monteCarloScore = clamp(monteCarloProbability * 100, 0, 10)
    const gapPressure = clamp(base.gap / 12, 0, 2)
    const combined = clamp((base.score * 0.48) + (markovScore * 0.24) + (monteCarloScore * 0.18) + gapPressure, 0, 10)
    const risk = getRiskLevel(base, combined)
    const confidence = clamp((combined * 7.5) + (base.frequency30 * 3) + (markovProbability * 100), 0, 99)
    const reasons = buildAdvancedReasons(base, markovProbability, monteCarloProbability, combined, risk)

    return {
      number: num,
      score: round1(combined),
      confidence: round1(confidence),
      baseScore: base.score,
      markovScore: round1(markovScore),
      monteCarloScore: round1(monteCarloScore),
      frequency30: base.frequency30,
      gap: base.gap,
      risk,
      reasons,
    }
  })

  const sortedHeatmap = [...heatmap].sort((a, b) => b.score - a.score || b.confidence - a.confidence || b.gap - a.gap || a.number.localeCompare(b.number))

  const markovTop = Object.entries(markovMap)
    .map(([number, count]) => ({ number, count, probability: markovTotal > 0 ? round1((count / markovTotal) * 100) : 0 }))
    .sort((a, b) => b.probability - a.probability || a.number.localeCompare(b.number))
    .slice(0, 10)

  const strategyBacktests = getStrategyBacktests(cleanRows)
  const aiInsights = buildAiInsights(sortedHeatmap, markovTop, strategyBacktests, latest, cleanRows.length)

  return {
    picks: sortedHeatmap.slice(0, 12),
    heatmap,
    markovSource: latest,
    markovTop,
    monteCarloRuns: monteCarlo.runs,
    strategyBacktests,
    aiInsights,
  }
}

function buildMarkov(rowsDesc: ParsedResult[]) {
  const transitions: Record<string, Record<string, number>> = {}
  const chronological = [...rowsDesc].reverse()

  for (let i = 1; i < chronological.length; i++) {
    const prev = chronological[i - 1].bot2
    const next = chronological[i].bot2
    if (!/^\d{2}$/.test(prev) || !/^\d{2}$/.test(next)) continue
    transitions[prev] ||= {}
    transitions[prev][next] = (transitions[prev][next] || 0) + 1
  }

  return { transitions }
}

function runMonteCarlo(rowsDesc: ParsedResult[], markovMap: Record<string, number>, markovTotal: number, runs: number) {
  const weights = ALL_2D.map(num => {
    const base = analyze2D(rowsDesc, num)
    const markovBoost = markovTotal > 0 ? ((markovMap[num] || 0) / markovTotal) * 18 : 0
    const recentPenalty = base.recentHit ? -1.4 : 0
    return Math.max(0.25, 1 + base.score + markovBoost + recentPenalty)
  })

  const totalWeight = weights.reduce((sum, value) => sum + value, 0)
  const cumulative: number[] = []
  weights.reduce((sum, value, index) => {
    const next = sum + value
    cumulative[index] = next
    return next
  }, 0)

  const counts: Record<string, number> = {}
  let seed = rowsDesc.slice(0, 8).map(r => Number(r.bot2) || 0).reduce((sum, value) => sum + value * 17, 7919)

  for (let i = 0; i < runs; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    const target = (seed / 4294967296) * totalWeight
    const idx = cumulative.findIndex(value => value >= target)
    const num = ALL_2D[idx === -1 ? ALL_2D.length - 1 : idx]
    counts[num] = (counts[num] || 0) + 1
  }

  const probability: Record<string, number> = {}
  for (const num of ALL_2D) {
    probability[num] = (counts[num] || 0) / runs
  }

  return { counts, probability, runs }
}

function getRiskLevel(base: NumberAnalysis, combinedScore: number): AdvancedPick['risk'] {
  if (base.recentHit || (base.frequency30 >= 4 && base.gap <= 2)) return 'high'
  if (combinedScore >= 7 && base.gap >= 4) return 'low'
  return 'medium'
}

function buildAdvancedReasons(base: NumberAnalysis, markovProbability: number, monteCarloProbability: number, combinedScore: number, risk: AdvancedPick['risk']) {
  const reasons = [...base.reasons]
  if (markovProbability > 0) reasons.push(`Markov หลังเลขล่าสุดให้น้ำหนัก ${round1(markovProbability * 100)}%`)
  if (monteCarloProbability > 0.015) reasons.push(`Monte Carlo จำลองแล้วติดกลุ่มบน ${round1(monteCarloProbability * 100)}%`)
  if (combinedScore >= 7) reasons.push('คะแนนรวม Hybrid อยู่ในโซนสูง')
  if (risk === 'high') reasons.push('ความเสี่ยงสูงเพราะอาจเป็นเลขที่ตลาดไล่หรือเพิ่งออก')
  if (risk === 'low') reasons.push('ความเสี่ยงต่ำกว่าเพราะคะแนนสูงและไม่ได้เพิ่งออกมากเกินไป')
  return reasons.slice(0, 5)
}

function getStrategyBacktests(rowsDesc: ParsedResult[]): StrategyBacktest[] {
  const strategies = [
    { key: 'hot', label: 'เลขร้อน', pick: pickHot },
    { key: 'cold', label: 'เลขอั้น', pick: pickCold },
    { key: 'hybrid', label: 'Hybrid Score', pick: pickHybrid },
    { key: 'markov', label: 'Markov + Gap', pick: pickMarkovGap },
    { key: 'monte', label: 'Monte Carlo', pick: pickMonteCarlo },
  ]

  return strategies.map(strategy => runStrategyBacktest(rowsDesc, strategy.label, strategy.pick))
}

type PickStrategy = (historyDesc: ParsedResult[], picks: number) => string[]

function runStrategyBacktest(rowsDesc: ParsedResult[], label: string, pickStrategy: PickStrategy): StrategyBacktest {
  const validRows = rowsDesc.filter(r => /^\d{2}$/.test(r.bot2))
  const picksPerRound = 3
  let wins = 0
  let spent = 0
  let returned = 0

  if (validRows.length < 12) {
    return { strategy: label, label, rounds: validRows.length, wins: 0, hitRate: 0, spent: 0, returned: 0, profit: 0, roi: 0 }
  }

  for (let i = validRows.length - 2; i >= 0; i--) {
    const history = validRows.slice(i + 1)
    const picks = pickStrategy(history, picksPerRound)
    spent += picksPerRound * 5
    if (picks.includes(validRows[i].bot2)) {
      wins += 1
      returned += 90
    }
  }

  const rounds = validRows.length - 1
  const profit = returned - spent
  return {
    strategy: label,
    label,
    rounds,
    wins,
    hitRate: round1((wins / rounds) * 100),
    spent,
    returned,
    profit,
    roi: spent > 0 ? round1((profit / spent) * 100) : 0,
  }
}

function pickHot(historyDesc: ParsedResult[], picks: number) {
  const counts: Record<string, number> = {}
  for (const r of historyDesc.slice(0, 60)) counts[r.bot2] = (counts[r.bot2] || 0) + 1
  return ALL_2D.sort((a, b) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b)).slice(0, picks)
}

function pickCold(historyDesc: ParsedResult[], picks: number) {
  const list = historyDesc.map(r => r.bot2)
  return ALL_2D
    .map(num => ({ num, gap: list.indexOf(num) === -1 ? list.length + 99 : list.indexOf(num) }))
    .sort((a, b) => b.gap - a.gap || a.num.localeCompare(b.num))
    .slice(0, picks)
    .map(item => item.num)
}

function pickHybrid(historyDesc: ParsedResult[], picks: number) {
  return ALL_2D
    .map(num => analyze2D(historyDesc, num))
    .sort((a, b) => b.score - a.score || b.frequency30 - a.frequency30 || b.gap - a.gap || a.number.localeCompare(b.number))
    .slice(0, picks)
    .map(item => item.number)
}

function pickMarkovGap(historyDesc: ParsedResult[], picks: number) {
  const latest = historyDesc[0]?.bot2 || '--'
  const markov = buildMarkov(historyDesc)
  const map = markov.transitions[latest] || {}
  const total = Object.values(map).reduce((sum, value) => sum + value, 0)
  return ALL_2D
    .map(num => {
      const base = analyze2D(historyDesc, num)
      const prob = total > 0 ? (map[num] || 0) / total : 0
      return { num, score: base.score + prob * 12 + clamp(base.gap / 10, 0, 2) }
    })
    .sort((a, b) => b.score - a.score || a.num.localeCompare(b.num))
    .slice(0, picks)
    .map(item => item.num)
}

function pickMonteCarlo(historyDesc: ParsedResult[], picks: number) {
  const latest = historyDesc[0]?.bot2 || '--'
  const markov = buildMarkov(historyDesc)
  const map = markov.transitions[latest] || {}
  const total = Object.values(map).reduce((sum, value) => sum + value, 0)
  const monte = runMonteCarlo(historyDesc, map, total, 15000)
  return ALL_2D
    .sort((a, b) => (monte.probability[b] || 0) - (monte.probability[a] || 0) || a.localeCompare(b))
    .slice(0, picks)
}

function buildAiInsights(picks: AdvancedPick[], markovTop: { number: string; probability: number; count: number }[], backtests: StrategyBacktest[], latest: string, totalRows: number) {
  const bestBacktest = [...backtests].sort((a, b) => b.roi - a.roi || b.hitRate - a.hitRate)[0]
  const top = picks[0]
  const second = picks[1]
  const insights: string[] = []

  if (top) {
    insights.push(`เลข ${top.number} ขึ้นอันดับ 1 เพราะ Hybrid Score ${top.score}/10, ขาด ${top.gap} งวด และ Confidence ${top.confidence}%`)
  }
  if (second) {
    insights.push(`เลขสำรองที่ควรจับตาคือ ${second.number} คะแนน ${second.score}/10 เหมาะใช้กระจายความเสี่ยงคู่กับเลขหลัก`)
  }
  if (markovTop[0]) {
    insights.push(`Markov จากงวดล่าสุด ${latest} ให้น้ำหนักเลขถัดไปที่ ${markovTop[0].number} ประมาณ ${markovTop[0].probability}% จากข้อมูลเปลี่ยนผ่านในอดีต`)
  }
  if (bestBacktest) {
    insights.push(`สูตรที่ย้อนหลังดูดีที่สุดตอนนี้คือ ${bestBacktest.label}: Hit rate ${bestBacktest.hitRate}% / ROI ${bestBacktest.roi}% จาก ${bestBacktest.rounds} งวด`)
  }
  insights.push(`ฐานข้อมูลประเภทนี้มี ${totalRows} งวด ยิ่งเพิ่มข้อมูลย้อนหลังหลายปี ระบบ Markov และ Backtest จะเสถียรกว่านี้`)
  insights.push('คำเตือน: ระบบนี้ช่วยคัดเลขจากสถิติ ไม่ใช่การันตีผล ควรใช้เป็นตัวกรองและจำกัดเงินต่อรอบเสมอ')

  return insights
}
