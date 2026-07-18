## วิธีการทำงาน (สำคัญ — อ่านก่อนแก้อะไร)

เว็บนี้**ไม่ได้**ดึงข้อมูลจาก Google Sheets ตรง ๆ ในเบราว์เซอร์ของผู้เข้าชมอีกต่อไป (วิธีเดิมมีปัญหาเรื่อง Google cache ข้อมูลเก่าค้างบ่อยมาก) แทนที่ด้วยระบบนี้:

1. **GitHub Action** (`sync-sheets.yml`) รันทุก 15 นาที (และกดรันเองได้ทันทีจากแท็บ Actions)
2. Action รันสคริปต์ `fetch-sheets.js` ซึ่งดึงข้อมูลจริงจาก Google Sheets ผ่าน **Sheets API v4** (ใช้ API key จริง ไม่ใช่ CSV export แบบเดิม)
3. บันทึกผลลัพธ์เป็นไฟล์ `data/performance-resilience.json` และ `data/folk-music.json`
4. หน้าเว็บทุกหน้าอ่านข้อมูลจากไฟล์ JSON สองไฟล์นี้เท่านั้น ไม่ได้ยิง request ไปที่ Google เลย

**ถ้าตัวเลขในเว็บดูไม่อัปเดต** ให้เช็ค 2 อย่างนี้ก่อน ไม่ต้องแก้โค้ด:
- แท็บ Actions → "Sync Google Sheets Data" รันล่าสุดสำเร็จ (สีเขียว) หรือไม่
- ลองกด "Run workflow" เองเพื่อบังคับให้ sync ทันที แล้วรอสัก 1-2 นาที ค่อยรีเฟรชเว็บ

## การตั้งค่าที่ต้องมีอยู่แล้ว (ทำครั้งเดียว)

1. **Google Cloud project** ที่เปิดใช้งาน Google Sheets API
2. **API key** จาก Google Cloud Console (จำกัดสิทธิ์ให้ใช้ได้แค่ Sheets API)
3. เพิ่ม API key เป็น **GitHub Secret** ชื่อ `SHEETS_API_KEY` (Settings → Secrets and variables → Actions)
4. Google Sheet ทั้งสองไฟล์เปิดสิทธิ์ **"Anyone with the link" → Viewer** (Sheets API ยังต้องเข้าถึงได้แม้จะไม่ใช้ CSV export แล้ว)

## วิธีติดตั้งบน GitHub Pages

1. อัปโหลดทุกไฟล์ตามโครงสร้างด้านบน — คง path/ชื่อโฟลเดอร์ให้ตรงเป๊ะ เพราะโค้ดอ้างอิงชื่อไฟล์/โฟลเดอร์ตรง ๆ
2. Settings → Pages → Source: เลือกวิธี deploy ที่ใช้อยู่ (branch หรือ GitHub Actions)
3. หลัง deploy สำเร็จ ไปที่แท็บ Actions → กด "Run workflow" บน "Sync Google Sheets Data" เพื่อสร้างข้อมูลจริงครั้งแรก
4. เปิด `https://<username>.github.io/<repo>/` เช็คว่าตัวเลขแสดงถูกต้อง

## ปรับ/เพิ่มหลักสูตรใหม่

1. คัดลอกโฟลเดอร์ `performance-resilience/` เป็นชื่อใหม่
2. แก้ `SHEET_ID` (comment อ้างอิง) และ `SESSION_META` ในไฟล์ `index.html` ของโฟลเดอร์นั้น
3. เพิ่ม sheet ID และรายชื่อแท็บที่ต้องการใน `scripts/fetch-sheets.js`
4. เพิ่มการ์ดใหม่ในหน้า hub (`/index.html`)

## แท็บที่ยังเป็น placeholder

- **PR&AW > ประเมิน:** จะแสดงผลอัตโนมัติทันทีที่มีคนตอบแบบประเมินภาพรวม (ตอนนี้ยังไม่มีข้อมูล)
- **Folk Music > ผลงานการแสดง:** เป็นข้อมูลคงที่ (hardcode) เพราะงานแสดงจบไปแล้วและ rubric การให้คะแนนซับซ้อน (5 กรรมการ x 6 ทีม x 5 หมวด)
