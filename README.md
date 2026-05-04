# 🎯 Alieninburi Lotto App

วิเคราะห์สถิติหวยจาก CSV — Next.js 14 · Deploy บน Vercel

---

## Deploy บน Vercel (ครั้งแรก)

1. Push โค้ดนี้ขึ้น GitHub repo ของคุณ
2. ไปที่ [vercel.com](https://vercel.com) → **Add New Project** → เลือก repo นี้
3. กด **Deploy** ได้เลย — ไม่ต้องตั้งค่าอะไรเพิ่ม

---

## อัปเดต CSV ข้อมูลใหม่

```
1. ดาวน์โหลด CSV ใหม่จาก alieninburi
2. เปลี่ยนชื่อไฟล์เป็น  lotto_data.csv
3. วางทับที่  public/lotto_data.csv
4. git add public/lotto_data.csv
5. git commit -m "update data"
6. git push
```

Vercel จะ deploy ให้อัตโนมัติภายใน ~1 นาที

---

## รันบนเครื่องตัวเอง

```bash
npm install
npm run dev
# เปิด http://localhost:3000
```

---

## โครงสร้างที่สำคัญ

```
├── public/
│   └── lotto_data.csv      ← อัปเดตไฟล์นี้เพื่อเปลี่ยนข้อมูล
├── pages/
│   ├── index.tsx           ← UI หลัก
│   └── api/lotto.ts        ← API อ่าน CSV
├── lib/
│   └── parseCSV.ts         ← logic วิเคราะห์ทั้งหมด
└── vercel.json             ← config สำหรับ Vercel
```

---

## Format CSV

```
วันที่,รหัสหวย,รางวัลทั้งหมด,4ตัวบน,3ตัวบน,2ตัวล่าง
2026-05-04,GLO,...,...,456,78
```

รองรับทั้ง format คอลัมน์แยก และ JSON ใน `รางวัลทั้งหมด`
