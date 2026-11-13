# QuoteMate

QuoteMate คือเว็บโซเชียลขนาดเล็กสำหรับแบ่งปันคำพูดและประโยคสั้นกับเพื่อน พัฒนาด้วย React, Vite, React Router, Tailwind CSS และ Firebase รองรับมือถือ เดสก์ท็อป และติดตั้งเป็น PWA ได้

## บริการ Firebase ที่ใช้

- Firebase Authentication: สมัครและเข้าสู่ระบบด้วย Username/Password
- Cloud Firestore: โปรไฟล์ รูปโปรไฟล์ โพสต์ Like Comment เพื่อน และการแจ้งเตือน
- Firebase Analytics: สถิติการใช้งานเว็บ

บัญชีใช้ Username เป็นหน้าจอหลัก และแปลงเป็นอีเมลภายในรูปแบบ `username@quotemate.app` ระบบเริ่มฐานข้อมูล Firebase ใหม่โดยไม่ย้ายข้อมูลจาก backend เดิม

## เริ่มต้นใช้งาน

ต้องใช้ Node.js 20.19+ หรือ 22.12+

1. ติดตั้ง dependencies

   ```bash
   npm install
   ```

2. เปิด [Firebase Console](https://console.firebase.google.com/) และเลือกโปรเจกต์ `quotemate-7efa1`

3. ไปที่ **Authentication > Sign-in method** แล้วเปิด **Email/Password** และเพิ่ม `azazxxc147896325-beep.github.io` ใน **Authentication > Settings > Authorized domains** สำหรับ GitHub Pages

4. ไปที่ **Firestore Database** แล้วสร้างฐานข้อมูล

5. Deploy Security Rules และ Indexes จากโฟลเดอร์โปรเจกต์

   ```bash
   npx firebase-tools login
   firebase deploy --only firestore
   ```

6. เปิด development server

   ```bash
   npm run dev
   ```

7. ตรวจและ build production

   ```bash
   npm run lint
   npm run test:run
   npm run build
   npm run preview
   ```

Firebase Web configuration อยู่ที่ `src/lib/firebase.js` และสิทธิ์ฐานข้อมูลอยู่ที่ `firestore.rules` รูปโปรไฟล์ถูกย่อเป็น WebP ขนาดไม่เกิน 512×512 พิกเซลก่อนบันทึก จึงไม่ต้องเปิด Cloud Storage หรือแผน Blaze

## โครงสร้างข้อมูล Firestore

- `usernames`: จอง Username ไม่ให้ซ้ำ
- `profiles`: โปรไฟล์ผู้ใช้ โดย Document ID ตรงกับ Firebase UID
- `posts`: โพสต์และจำนวน Like/Comment
- `comments`: ความคิดเห็น
- `likes`: รายการกดถูกใจ
- `friend_requests`: คำขอเป็นเพื่อน
- `friendships`: ความสัมพันธ์เพื่อนแบบสองทิศทาง
- `notifications`: การแจ้งเตือน

## เช็กลิสต์ทดสอบ

- สมัครสมาชิกอย่างน้อย 2 บัญชีและตรวจ Username ซ้ำ
- เข้าสู่ระบบ ออกจากระบบ และ refresh หน้า
- สร้าง แก้ไข ลบ Like และ Comment
- ส่ง ยกเลิก และตอบรับคำขอเป็นเพื่อน
- ตรวจ Friends Feed และการแจ้งเตือนแบบ Realtime
- แก้โปรไฟล์และอัปโหลด JPEG/PNG/WebP ไม่เกิน 2 MB
- ตรวจ responsive ที่ 375px, 768px และ 1440px

## ผู้พัฒนา

กิตตินันท์ บุญคุ้ม · รหัสนักศึกษา 66112126

IG342 การพัฒนาแอปพลิเคชันบนอุปกรณ์เคลื่อนที่ 1
