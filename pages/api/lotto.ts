import fs from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const GITHUB_CSV_URL = process.env.GITHUB_CSV_URL

  // ─── 1. ถ้ามี GITHUB_CSV_URL ให้ดึงจาก URL นั้น ───────────────────────────
  if (GITHUB_CSV_URL && GITHUB_CSV_URL !== 'YOUR_CSV_URL_HERE') {
    try {
      const response = await fetch(GITHUB_CSV_URL, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!response.ok) {
        return res.status(response.status).json({ error: `Cannot fetch CSV: ${response.status}` })
      }
      const text = await response.text()
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
      return res.status(200).send(text)
    } catch (err) {
      return res.status(500).json({ error: `Fetch error: ${String(err)}` })
    }
  }

  // ─── 2. Fallback → อ่านจาก public/lotto_data.csv (วางไฟล์ CSV ตรงนี้ได้เลย) ─
  const localPath = path.join(process.cwd(), 'public', 'lotto_data.csv')
  if (fs.existsSync(localPath)) {
    const text = fs.readFileSync(localPath, 'utf-8')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(text)
  }

  // ─── 3. ไม่มีข้อมูลเลย → ส่งกลับ CSV header เปล่า ──────────────────────────
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.status(200).send('วันที่,รหัสหวย,รางวัลทั้งหมด,4ตัวบน,3ตัวบน,2ตัวล่าง\n')
}
