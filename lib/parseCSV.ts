export interface LottoRow {
  date: string
  lottoType: string
  raw: string
  top4: string
  top3: string
  bot2: string
}

export interface ParsedResult {
  date: string
  lottoType: string
  top4: string
  top3: string
  bot2: string
  todKey: string
}

export interface NumberAnalysis {
  input: string
  type: '2D' | '3D'
  score: number
  status: string
  risk: 'low' | 'medium' | 'high'
  frequency: number
  gap: number
  lastSeenDate: string
  recentHits: number
  todHits: number
  reasons: string[]
  warning: string
}

export interface Recommendation {
  num: string
  score: number
  frequency: number
  gap: number
  lastSeenDate: string
  status: string
  reason: string
}

export interface BacktestResult {
  rounds: number
  hits: number
  misses: number
  stake: number
  payout: number
  profit: number
  roi: number
  hitRate: number
  picksPerRound: number
}

export function parseCSV(text: string): ParsedResult[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const header = lines[0].replace(/^\uFEFF/, '')
  const cols = header.split(',').map(c => c.trim())

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
      inQuotes = !inQuotes
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
  'GLO': '🇹🇭 หวยรัฐบาลไทย',
  'BAAC': '🌾 ธ.ก.ส.',
  'GSB': '🏦 ออมสิน',
  'SET': '📈 หุ้นไทย (SET)',
  'KTOP30': '📊 หุ้นไทย K-Top30',
  'KTOPVIP': '📊 หุ้นไทย K-Top VIP',
  'DAX': '🇩🇪 หุ้นเยอรมัน (DAX)',
  'DJI': '🇺🇸 ดาวโจนส์ (DJI)',
  'DJIVIP': '🇺🇸 ดาวโจนส์ VIP',
  'BSE': '🇮🇳 หุ้นอินเดีย (BSE)',
  'EGX30': '🇪🇬 หุ้นอียิปต์ (EGX30)',
  'HSI_1': '🇭🇰 ฮั่งเส็ง รอบ 1',
  'HSI_2': '🇭🇰 ฮั่งเส็ง รอบ 2',
  'HSIVIP_1': '🇭🇰 ฮั่งเส็ง VIP รอบ 1',
  'HSIVIP_2': '🇭🇰 ฮั่งเส็ง VIP รอบ 2',
  'NKY_1': '🇯🇵 นิเคอิ รอบ 1',
  'NKY_2': '🇯🇵 นิเคอิ รอบ 2',
  'NKYVIP_1': '🇯🇵 นิเคอิ VIP รอบ 1',
  'NKYVIP_2': '🇯🇵 นิเคอิ VIP รอบ 2',
  'STI': '🇸🇬 หุ้นสิงคโปร์ (STI)',
  'STIVIP': '🇸🇬 หุ้นสิงคโปร์ VIP',
  'SZSE_1': '🇨🇳 หุ้นจีน เซินเจิ้น รอบ 1',
  'SZSE_2': '🇨🇳 หุ้นจีน เซินเจิ้น รอบ 2',
  'SZSEVIP_1': '🇨🇳 หุ้นจีน เซินเจิ้น VIP รอบ 1',
  'SZSEVIP_2': '🇨🇳 หุ้นจีน เซินเจิ้น VIP รอบ 2',
  'TAIEX': '🇹🇼 หุ้นไต้หวัน (TAIEX)',
  'TAIEXCIP': '🇹🇼 หุ้นไต้หวัน CIP',
  'UKX': '🇬🇧 หุ้นอังกฤษ (FTSE)',
  'UKXVIP': '🇬🇧 หุ้นอังกฤษ VIP',
  'MOEX': '🇷🇺 หุ้นรัสเซีย (MOEX)',
  'LOEX': '🌍 หุ้น LOEX',
  'LATV': '🇱🇦 หวยลาว TV',
  'LAVIP': '🇱🇦 หวยลาว VIP',
  'LAHD': '🇱🇦 หวยลาว HD',
  'LASMK': '🇱🇦 หวยลาว SMK',
  'LASTR': '🇱🇦 หวยลาว Star',
  'LASTRVIP': '🇱🇦 หวยลาว Star VIP',
  'LATK5D': '🇱🇦 หวยลาว TK 5D',
  'LATKVIP': '🇱🇦 หวยลาว TK VIP',
  'LALOT': '🇱🇦 หวยลาว Lot',
  'Laaoo': '🇱🇦 หวยลาว',
  'VNLOT': '🇻🇳 หวยเวียดนาม Lot',
  'VNSTR': '🇻🇳 หวยเวียดนาม Star',
  'VNTV': '🇻🇳 หวยเวียดนาม TV',
  'VNVIP': '🇻🇳 หวยเวียดนาม VIP',
  'VNAS': '🇻🇳 หวยเวียดนาม AS',
  'VNEXT': '🇻🇳 หวยเวียดนาม EXT',
  'VNHD': '🇻🇳 หวยเวียดนาม HD',
  'VNKCH': '🇻🇳 หวยเวียดนาม KCH',
  'VNPTN': '🇻🇳 หวยเวียดนาม PTN',
  'VNSPC_2': '🇻🇳 หวยเวียดนาม SPC รอบ 2',
  'VNSPCb': '🇻🇳 หวยเวียดนาม SPC B',
  'GRAND_DRAGON_4D': '🐉 Grand Dragon 4D',
  'MAGNUM': '🇲🇾 หวยมาเลย์ Magnum',
  'MAGNUM_4D': '🇲🇾 หวยมาเลย์ Magnum 4D',
  'SINGAPORE_4D': '🇸🇬 หวยสิงคโปร์ 4D',
}

export function getLottoName(code: string): string {
  if (LOTTO_NAMES[code]) return LOTTO_NAMES[code]
  if (code.startsWith('LV_R')) return `🎰 หวยหุ้น รอบ ${code.replace('LV_R', '')}`
  return code
}

export function getStats(rows: ParsedResult[]) {
  const bot2Counts: Record<string, number> = {}
  const top3Counts: Record<string, number> = {}
  const todCounts: Record<string, number> = {}

  for (const r of rows) {
    if (r.bot2 && /^\d{2}$/.test(r.bot2)) bot2Counts[r.bot2] = (bot2Counts[r.bot2] || 0) + 1
    if (r.top3 && /^\d{3}$/.test(r.top3)) top3Counts[r.top3] = (top3Counts[r.top3] || 0) + 1
    if (r.todKey) todCounts[r.todKey] = (todCounts[r.todKey] || 0) + 1
  }

  const sortedBot2 = Object.entries(bot2Counts).sort((a, b) => b[1] - a[1])
  const allNums = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))
  const bot2List = rows.map(r => r.bot2).filter(v => /^\d{2}$/.test(v))
  const cold: { num: string; gap: number }[] = allNums.map(n => {
    const idx = bot2List.indexOf(n)
    return { num: n, gap: idx === -1 ? bot2List.length + 999 : idx }
  }).sort((a, b) => b.gap - a.gap).slice(0, 10)

  const sortedTod = Object.entries(todCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const recommendations = getRecommendations(rows).slice(0, 12)

  return { bot2Counts, top3Counts, todCounts, sortedBot2, cold, sortedTod, recommendations }
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num))
}

function sortDescDate(rows: ParsedResult[]) {
  return [...rows].sort((a, b) => (b.date > a.date ? 1 : -1))
}

export function analyzeNumber(rows: ParsedResult[], rawInput: string): NumberAnalysis | null {
  const input = rawInput.replace(/\D/g, '')
  if (!/^\d{2,3}$/.test(input)) return null

  const sorted = sortDescDate(rows)
  const is3D = input.length === 3
  const sequence = sorted.map(r => is3D ? r.top3 : r.bot2).filter(v => new RegExp(`^\\d{${input.length}}$`).test(v))
  const frequency = sequence.filter(v => v === input).length
  const gapIndex = sequence.indexOf(input)
  const gap = gapIndex === -1 ? sequence.length : gapIndex
  const lastSeenRow = sorted.find(r => (is3D ? r.top3 : r.bot2) === input)
  const lastSeenDate = lastSeenRow?.date || 'ยังไม่พบในชุดข้อมูลนี้'
  const recentHits = sequence.slice(0, 7).filter(v => v === input).length
  const todKey = is3D ? input.split('').sort().join('') : ''
  const todHits = is3D ? sorted.filter(r => r.todKey === todKey).length : 0

  const total = Math.max(sequence.length, 1)
  const expectedFrequency = is3D ? total / 1000 : total / 100
  const freqScore = clamp((frequency / Math.max(expectedFrequency, 0.35)) * 2.2, 0, 3)
  const gapScore = is3D ? clamp(gap / 18, 0, 2.2) : clamp(gap / 10, 0, 2.2)
  const todScore = is3D ? clamp(todHits / 3, 0, 1.2) : 0
  const recentPenalty = recentHits > 0 ? 1.3 : gap <= 1 ? 0.8 : 0
  const neverPenalty = frequency === 0 ? 0.8 : 0
  const score = clamp(4 + freqScore + gapScore + todScore - recentPenalty - neverPenalty, 0, 10)

  const reasons: string[] = []
  if (frequency > 0) reasons.push(`เคยออก ${frequency} ครั้งในข้อมูลชุดนี้`)
  else reasons.push('ยังไม่เคยออกในข้อมูลชุดนี้ จัดเป็นเลขเสี่ยงสูง')
  if (gap >= 10) reasons.push(`ขาดมานาน ${gap} งวด มีน้ำหนักฝั่งเลขเย็น`)
  else if (gap <= 2) reasons.push(`เพิ่งออกเมื่อ ${gap} งวดก่อน ระวังการไล่เลขร้อน`)
  else reasons.push(`ระยะห่าง ${gap} งวด ยังพอใช้วิเคราะห์ต่อได้`)
  if (recentHits > 0) reasons.push('มีการออกใน 7 งวดล่าสุด จึงถูกหักคะแนนความเสี่ยง')
  if (todHits > 0) reasons.push(`ชุดโต๊ดเดียวกันพบ ${todHits} ครั้ง`)

  const risk: NumberAnalysis['risk'] = score >= 7 && recentHits === 0 ? 'low' : score >= 5.5 ? 'medium' : 'high'
  const status = score >= 7 ? 'น่าจับตา' : score >= 5.5 ? 'พอมีทรง' : 'ยังไม่เด่น'
  const warning = risk === 'low'
    ? 'ใช้เป็นตัวคัดกรองได้ แต่ยังต้องจำกัดทุนทุกครั้ง'
    : risk === 'medium'
      ? 'มีสัญญาณบางส่วน อย่าเพิ่มไม้หนักถ้ายังไม่ได้ backtest'
      : 'ความเสี่ยงสูง เหมาะเก็บดูมากกว่าเล่นหนัก'

  return {
    input,
    type: is3D ? '3D' : '2D',
    score: Number(score.toFixed(1)),
    status,
    risk,
    frequency,
    gap,
    lastSeenDate,
    recentHits,
    todHits,
    reasons,
    warning,
  }
}

export function getRecommendations(rows: ParsedResult[]): Recommendation[] {
  const sorted = sortDescDate(rows)
  const allNums = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))
  const bot2List = sorted.map(r => r.bot2).filter(v => /^\d{2}$/.test(v))
  const total = Math.max(bot2List.length, 1)

  return allNums.map(num => {
    const frequency = bot2List.filter(v => v === num).length
    const gapIndex = bot2List.indexOf(num)
    const gap = gapIndex === -1 ? total : gapIndex
    const lastSeenDate = sorted.find(r => r.bot2 === num)?.date || 'ยังไม่เคยออก'
    const expected = total / 100
    const freqScore = clamp((frequency / Math.max(expected, 0.35)) * 2.6, 0, 3.1)
    const gapScore = clamp(gap / 9, 0, 3.1)
    const recentPenalty = gap <= 2 ? 1.4 : gap <= 4 ? 0.6 : 0
    const neverPenalty = frequency === 0 ? 0.5 : 0
    const tooColdPenalty = gap >= Math.max(25, total * 0.75) ? 0.6 : 0
    const score = clamp(3.5 + freqScore + gapScore - recentPenalty - neverPenalty - tooColdPenalty, 0, 10)
    const status = score >= 7 ? 'เด่น' : score >= 6 ? 'รอง' : 'เฝ้าดู'
    const reason = frequency === 0
      ? `ยังไม่เคยออก / ขาด ${gap} งวด`
      : `ออก ${frequency} ครั้ง / ขาด ${gap} งวด`

    return { num, score: Number(score.toFixed(1)), frequency, gap, lastSeenDate, status, reason }
  }).sort((a, b) => b.score - a.score || b.gap - a.gap || b.frequency - a.frequency)
}

export function runBacktest(rows: ParsedResult[], lookback = 30, picksPerRound = 3, stakePerPick = 5, payoutRate = 90): BacktestResult {
  const chronological = [...rows]
    .filter(r => /^\d{2}$/.test(r.bot2))
    .sort((a, b) => (a.date > b.date ? 1 : -1))

  let hits = 0
  let rounds = 0

  for (let i = lookback; i < chronological.length; i++) {
    const history = chronological.slice(Math.max(0, i - lookback), i)
    const picks = getRecommendations(sortDescDate(history)).slice(0, picksPerRound).map(p => p.num)
    if (picks.length === 0) continue
    rounds += 1
    if (picks.includes(chronological[i].bot2)) hits += 1
  }

  const misses = rounds - hits
  const stake = rounds * picksPerRound * stakePerPick
  const payout = hits * stakePerPick * payoutRate
  const profit = payout - stake
  const roi = stake > 0 ? (profit / stake) * 100 : 0
  const hitRate = rounds > 0 ? (hits / rounds) * 100 : 0

  return {
    rounds,
    hits,
    misses,
    stake,
    payout,
    profit,
    roi: Number(roi.toFixed(1)),
    hitRate: Number(hitRate.toFixed(1)),
    picksPerRound,
  }
}
