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

export function parseCSV(text: string): ParsedResult[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  // Remove BOM if present
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

    // Handle CSV fields with commas inside quotes
    const fields = parseCSVLine(line)

    let top3 = top3Idx >= 0 ? (fields[top3Idx] || '').trim() : ''
    let bot2 = bot2Idx >= 0 ? (fields[bot2Idx] || '').trim() : ''
    let top4 = top4Idx >= 0 ? (fields[top4Idx] || '').trim() : ''

    // Try to parse from raw dict if needed
    if ((!top3 || !bot2) && rawIdx >= 0) {
      const raw = fields[rawIdx] || ''
      const b3 = raw.match(/'B3':\s*'([^']+)'/)?.[1] || raw.match(/"B3":\s*"([^"]+)"/)?.[1] || ''
      const b2 = raw.match(/'B2':\s*'([^']+)'/)?.[1] || raw.match(/"B2":\s*"([^"]+)"/)?.[1] || ''
      const b4 = raw.match(/'B4':\s*'([^']+)'/)?.[1] || raw.match(/"B4":\s*"([^"]+)"/)?.[1] || ''
      if (!top3) top3 = b3
      if (!bot2) bot2 = b2
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
    if (r.bot2 && /^\d{2}$/.test(r.bot2)) {
      bot2Counts[r.bot2] = (bot2Counts[r.bot2] || 0) + 1
    }
    if (r.top3 && /^\d{3}$/.test(r.top3)) {
      top3Counts[r.top3] = (top3Counts[r.top3] || 0) + 1
    }
    if (r.todKey) {
      todCounts[r.todKey] = (todCounts[r.todKey] || 0) + 1
    }
  }

  const sortedBot2 = Object.entries(bot2Counts)
    .sort((a, b) => b[1] - a[1])

  // Cold numbers
  const allNums = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))
  const bot2List = rows.map(r => r.bot2).filter(v => /^\d{2}$/.test(v))
  const cold: { num: string; gap: number }[] = allNums.map(n => {
    const idx = bot2List.indexOf(n)
    return { num: n, gap: idx === -1 ? bot2List.length + 999 : idx }
  }).sort((a, b) => b.gap - a.gap).slice(0, 10)

  const sortedTod = Object.entries(todCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return { bot2Counts, top3Counts, todCounts, sortedBot2, cold, sortedTod }
}
