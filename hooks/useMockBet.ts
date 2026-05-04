import { useCallback, useEffect, useState } from 'react'
import type { ParsedResult } from '../lib/parseCSV'

export type BetType = '3ตัวบน' | '2ตัวล่าง' | 'โต๊ด3ตัว' | 'วิ่งบน' | 'วิ่งล่าง'
export type BetStatus = 'pending' | 'win' | 'lose'

export interface MockBet {
  id: string
  lottoCode: string
  lottoName: string
  targetDate: string
  betType: BetType
  number: string
  status: BetStatus
  actualResult?: string
  timestamp: string
}

const STORAGE_KEY = 'alieninburi_mock_bets_v1'

function loadBets(): MockBet[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveBets(bets: MockBet[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets))
}

/** Check if a single bet matches actual lotto result */
function evaluateBet(bet: MockBet, result: ParsedResult): BetStatus | null {
  // result must match lottoCode and targetDate
  if (result.lottoType !== bet.lottoCode) return null
  if (result.date !== bet.targetDate) return null

  const num = bet.number.trim()
  switch (bet.betType) {
    case '3ตัวบน':
      return result.top3 === num ? 'win' : 'lose'
    case '2ตัวล่าง':
      return result.bot2 === num ? 'win' : 'lose'
    case 'โต๊ด3ตัว': {
      // permutations of 3 digits
      if (!result.top3 || result.top3.length < 3 || num.length < 3) return 'lose'
      const perms = new Set<string>()
      const d = num.split('')
      for (const a of d) for (const b of d) for (const c of d) {
        if (a !== b || b !== c || a !== c) perms.add(a + b + c)
      }
      // generate all 6 unique permutations
      const p: string[] = []
      const arr = num.split('')
      function permute(a: string[], l: number) {
        if (l === a.length) { p.push(a.join('')); return }
        for (let i = l; i < a.length; i++) {
          [a[l], a[i]] = [a[i], a[l]]
          permute([...a], l + 1)
          ;[a[l], a[i]] = [a[i], a[l]]
        }
      }
      permute(arr, 0)
      return p.includes(result.top3) ? 'win' : 'lose'
    }
    case 'วิ่งบน':
      return result.top3?.includes(num) ? 'win' : 'lose'
    case 'วิ่งล่าง':
      return result.bot2?.includes(num) ? 'win' : 'lose'
    default:
      return 'lose'
  }
}

export function useMockBet(allRows: ParsedResult[]) {
  const [bets, setBets] = useState<MockBet[]>([])
  const [mounted, setMounted] = useState(false)
  const [notification, setNotification] = useState<{ message: string; isWin: boolean } | null>(null)

  // Load from localStorage on client
  useEffect(() => {
    setBets(loadBets())
    setMounted(true)
  }, [])

  // Auto-evaluate pending bets whenever allRows changes
  useEffect(() => {
    if (!mounted || allRows.length === 0) return
    const current = loadBets()
    let changed = false
    const updated = current.map(bet => {
      if (bet.status !== 'pending') return bet
      for (const row of allRows) {
        const result = evaluateBet(bet, row)
        if (result !== null) {
          changed = true
          const actualResult = `${row.top3 || '---'} / ${row.bot2 || '--'}`
          return { ...bet, status: result, actualResult }
        }
      }
      return bet
    })
    if (changed) {
      saveBets(updated)
      setBets(updated)
      // Show notification for newly resolved bets
      const wins = updated.filter(b => b.status === 'win').length
      const prev = current.filter(b => b.status === 'win').length
      if (wins > prev) {
        setNotification({ message: `🎉 ถูกรางวัล! ${wins - prev} รายการ`, isWin: true })
        setTimeout(() => setNotification(null), 4000)
      } else {
        const newLoses = updated.filter(b => b.status === 'lose').length - current.filter(b => b.status === 'lose').length
        if (newLoses > 0) {
          setNotification({ message: `😅 ผลออกแล้ว ไม่ถูก ${newLoses} รายการ`, isWin: false })
          setTimeout(() => setNotification(null), 4000)
        }
      }
    }
  }, [allRows, mounted])

  const addBet = useCallback((bet: Omit<MockBet, 'id' | 'timestamp' | 'status'>) => {
    const newBet: MockBet = {
      ...bet,
      id: `bet_${Date.now()}`,
      status: 'pending',
      timestamp: new Date().toISOString(),
    }
    const updated = [...loadBets(), newBet]
    saveBets(updated)
    setBets(updated)
    setNotification({ message: `✅ บันทึกการทดลองซื้อแล้ว!`, isWin: true })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const deleteBet = useCallback((id: string) => {
    const updated = loadBets().filter(b => b.id !== id)
    saveBets(updated)
    setBets(updated)
  }, [])

  const clearAll = useCallback(() => {
    saveBets([])
    setBets([])
  }, [])

  // Stats
  const stats = {
    total: bets.length,
    pending: bets.filter(b => b.status === 'pending').length,
    wins: bets.filter(b => b.status === 'win').length,
    losses: bets.filter(b => b.status === 'lose').length,
    winRate: bets.filter(b => b.status !== 'pending').length > 0
      ? Math.round((bets.filter(b => b.status === 'win').length / bets.filter(b => b.status !== 'pending').length) * 100)
      : 0,
    // Best lotto by win rate
    bestLotto: (() => {
      const byLotto: Record<string, { wins: number; total: number; name: string }> = {}
      bets.filter(b => b.status !== 'pending').forEach(b => {
        if (!byLotto[b.lottoCode]) byLotto[b.lottoCode] = { wins: 0, total: 0, name: b.lottoName }
        byLotto[b.lottoCode].total++
        if (b.status === 'win') byLotto[b.lottoCode].wins++
      })
      let best = { name: '-', rate: 0 }
      Object.values(byLotto).forEach(v => {
        const rate = Math.round((v.wins / v.total) * 100)
        if (rate > best.rate) best = { name: v.name, rate }
      })
      return best
    })(),
    // Most picked number
    topNumber: (() => {
      const count: Record<string, number> = {}
      bets.forEach(b => { count[b.number] = (count[b.number] || 0) + 1 })
      return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    })(),
  }

  return { bets, addBet, deleteBet, clearAll, stats, notification, mounted }
}
