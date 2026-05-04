import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const GITHUB_RAW =
    process.env.GITHUB_CSV_URL ||
    'https://raw.githubusercontent.com/YOUR_USERNAME/lotto/main/alieninburi_lotto_data.csv'

  try {
    const response = await fetch(GITHUB_RAW, {
      headers: { 'Cache-Control': 'no-cache' },
      next: { revalidate: 300 },
    } as RequestInit)

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Cannot fetch CSV' })
    }

    const text = await response.text()
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    res.status(200).send(text)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
