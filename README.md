# 🛸 Alieninburi Lotto Analytics

เว็บแอปวิเคราะห์สถิติหวย สำหรับมือถือ ทำงานบน Vercel

## Tech Stack
- Next.js 14 (Pages Router)
- TypeScript
- CSS Modules
- Deployed on Vercel

---

## วิธี Deploy บน Vercel

### 1. Upload โปรเจกต์นี้ขึ้น GitHub repo ใหม่

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/lotto-web.git
git push -u origin main
```

### 2. ไปที่ vercel.com → New Project → Import repo

### 3. ตั้งค่า Environment Variable ใน Vercel

| Variable | Value |
|---|---|
| `GITHUB_CSV_URL` | URL ของไฟล์ CSV ดิบใน GitHub |

**ตัวอย่าง URL:**
```
https://raw.githubusercontent.com/YOUR_USERNAME/lotto/main/alieninburi_lotto_data.csv
```

> ถ้า repo เป็น Private ให้ใช้ GitHub Token แทน และแก้ API route ใน `pages/api/lotto.ts`

### 4. กด Deploy → รอสักครู่ → เสร็จแล้ว! 🚀

---

## โครงสร้างโปรเจกต์

```
├── pages/
│   ├── _app.tsx         # App wrapper
│   ├── _document.tsx    # HTML document
│   ├── index.tsx        # หน้าหลัก
│   ├── index.module.css # Styles
│   └── api/
│       └── lotto.ts     # API route ดึง CSV
├── lib/
│   └── parseCSV.ts      # Parser + stats engine
├── styles/
│   └── globals.css      # Global styles
└── public/              # Static assets
```

---

## ฟีเจอร์

- 🔥 **ร้อนแรง** — 2 ตัวล่างออกบ่อยที่สุด พร้อม bar chart
- ❄️ **เลขอั้น** — เลขที่หายนานที่สุด
- 🎲 **โต๊ด** — ชุด 3 ตัวโต๊ดยอดนิยม พร้อม permutations
- 📋 **ประวัติ** — ผลรางวัลย้อนหลัง 30 งวด
- 📱 Mobile-first design, dark theme
- ⚡ Fast — ข้อมูล cache 5 นาที

---

## หากต้องการ Private CSV

แก้ไข `pages/api/lotto.ts`:

```typescript
const response = await fetch(GITHUB_RAW, {
  headers: {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3.raw',
  }
})
```

แล้วเพิ่ม `GITHUB_TOKEN` ใน Vercel Environment Variables
