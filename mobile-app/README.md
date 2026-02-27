# RabCheck แอปมือถือ (Capacitor)

โฟลเดอร์นี้เป็นโปรเจกต์ **Capacitor** สำหรับห่อเว็บ RabCheck เป็นแอป Android (ได้ไฟล์ APK)  
แอปจะเปิด WebView ชี้ไปที่ URL ของ RabCheck — **ต้องมีเซิร์ฟเวอร์ RabCheck รันอยู่**  
เมื่อแอปเปิด จะโหลดหน้าจอจากเซิร์ฟเวอร์โดยตรง ดังนั้น **การแก้ไขในโฟลเดอร์ `frontend` ของโปรเจกต์หลักจะมีผลทันที** (ไม่ต้อง copy ไฟล์เข้า mobile-app)

**คู่มือฉบับเต็ม (ขั้นตอนตั้งแต่ติดตั้ง Node.js, Android Studio จนได้ APK):** ดูที่ **`คู่มือแนวทางแปลงเป็นแอปมือถือ.md`** ในโฟลเดอร์โปรเจกต์ RabCheck — ส่วน "แนวทางที่ 3"

---

## สิ่งที่ต้องมี

- **Node.js** (LTS) — ใช้รัน `npm install`, `npx cap sync`, `npx cap open android`
- **Android Studio** — ใช้ build APK และ (ทางเลือก) รันบนอีมูเลเตอร์/มือถือ
- **Android SDK Platform API 34 (Android 14.0)** — โปรเจกต์นี้ใช้ `compileSdkVersion = 34` ต้องติดตั้งใน Android Studio: **File → Settings → Languages & Frameworks → Android SDK** แท็บ **SDK Platforms** ติ๊ก **Android 14.0 ("UpsideDownCake")** API Level **34** แล้ว Apply
- **Gradle 8.6 ขึ้นไป** — โปรเจกต์ตั้งค่าไว้ใน `android/gradle/wrapper/gradle-wrapper.properties` แล้ว (ถ้า Android Studio แจ้ง "Minimum supported Gradle version is 8.6" ให้แก้ไฟล์นี้ให้เป็น `gradle-8.6-all.zip` หรือสูงกว่า แล้ว Sync ใหม่)

---

## กำหนด URL ของ RabCheck

แก้ไฟล์ **`capacitor.config.json`** ในโฟลเดอร์นี้ (ส่วน `server.url`):

- **ใช้ใน WiFi เดียวกับคอมที่รัน RabCheck:** ใส่ `http://[IP ของคอม]:5000`  
  ตัวอย่าง: `http://192.168.1.105:5000` (หา IP จาก `ipconfig` บนคอม)  
  ใช้ `"cleartext": true`
- **ใช้จากที่ไหนก็ได้ (ผ่านเน็ต):** ใส่ URL แบบ **HTTPS** จาก ngrok  
  **วิธีทำ:** (1) รัน RabCheck บนคอม (`run.bat`) (2) รัน ngrok ชี้พอร์ต 5000 — ดับเบิลคลิก `run_ngrok.bat` ในโฟลเดอร์ RabCheck หรือรัน `ngrok http 5000` (3) คัดลอก URL แบบ HTTPS จากหน้าต่าง ngrok (เช่น `https://abc123.ngrok-free.app`) (4) ใส่ URL นั้นใน `server.url` และไม่ต้องใส่ `cleartext` หรือใส่ `false` (5) รัน `npx cap sync` แล้ว build APK ใหม่  
  **หมายเหตุ:** URL ngrok ฟรีเปลี่ยนทุกครั้งที่รัน — ถ้ารัน ngrok ใหม่ต้องแก้ `server.url` แล้ว `npx cap sync` แล้ว build APK ใหม่

ตัวอย่างใน `capacitor.config.json`:

**กรณีใช้ใน WiFi (HTTP):**

```json
"server": {
  "url": "http://192.168.1.105:5000",
  "cleartext": true
}
```

- **`url`** — ที่อยู่ของเซิร์ฟเวอร์ RabCheck ที่แอปจะเปิดใน WebView แทน `192.168.1.105` ด้วย **IP จริงของคอม** (หาได้จาก `ipconfig` ใน Command Prompt ดูค่า IPv4 ของการ์ด WiFi) พอร์ต `5000` คือพอร์ตที่ RabCheck รัน
- **`cleartext": true`** — อนุญาตให้แอปโหลดหน้าเว็บผ่าน **HTTP** (ไม่เข้ารหัส) ได้ เพราะ Android ตั้งแต่เวอร์ชันเก่ามักบล็อก HTTP ใน WebView ถ้าไม่ตั้งค่านี้ แอปอาจโหลด blank หรือ error เมื่อ `url` เป็น `http://...`

**กรณีใช้จากที่ไหนก็ได้ (HTTPS ผ่าน ngrok):**

```json
"server": {
  "url": "https://abc123.ngrok-free.app"
}
```

- **`url`** — ใส่ URL แบบ **HTTPS** ที่ได้จาก ngrok (เช่น หลังรัน `ngrok http 5000`) ไม่ต้องมี path ต่อท้าย แค่โดเมน เช่น `https://xxxx.ngrok-free.app`
- **ไม่ต้องใส่ `cleartext`** — เมื่อใช้ HTTPS ไม่จำเป็นต้องเปิด cleartext (หรือใส่ `"cleartext": false` ก็ได้)

หลังแก้ `capacitor.config.json` ทุกครั้ง ให้รัน **`npx cap sync`** แล้ว build APK ใหม่ ถึงจะได้แอปที่ชี้ URL ใหม่

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm install` | ติดตั้ง dependencies (ทำครั้งแรกหรือเมื่อมี package ใหม่) |
| `npx cap sync` | อัปเดต config และไฟล์ไปยังโปรเจกต์ Android (ต้องรันหลังแก้ `capacitor.config.json`) |
| `npx cap open android` | เปิดโปรเจกต์ Android ใน Android Studio |
| `npm run cap:sync` | เหมือน `npx cap sync` |
| `npm run cap:open:android` | เหมือน `npx cap open android` |

---

## ตั้งค่าและใช้งาน Android Studio

**ติดตั้ง Android Studio (ถ้ายังไม่มี)**  
- ดาวน์โหลด: https://developer.android.com/studio  
- ติดตั้งแล้วเปิดครั้งแรก → เลือก **Standard** → รอให้ดาวน์โหลด SDK เสร็จ  
- มีคำถาม Android SDK License ให้กด **Accept**  
- **ติดตั้ง Android 14.0 (API 34):** **File → Settings → Languages & Frameworks → Android SDK** → แท็บ **SDK Platforms** → ติ๊ก **Android 14.0 ("UpsideDownCake")** API Level **34** → Apply

**เปิดโปรเจกต์**  
- รัน `npx cap open android` จะเปิด Android Studio โหลดโฟลเดอร์ `android`  
- หรือเปิดเอง: **File → Open** เลือกโฟลเดอร์ **`RabCheck/mobile-app/android`**  
- รอ **Gradle sync** เสร็จ (ครั้งแรกอาจนาน) — ถ้าเจอ error เรื่อง Gradle หรือ Java ดูส่วน **แก้ปัญหา** ด้านล่าง

**Build เป็น APK**  
- เมนู **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**  
- รอจนขึ้น "APK(s) generated successfully" แล้วกด **locate** ใน popup เพื่อเปิดโฟลเดอร์ APK  
- ไฟล์อยู่ที่ **`android/app/build/outputs/apk/debug/app-debug.apk`**

**รันบนมือถือหรืออีมูเลเตอร์ (ทางเลือก)**  
- เสียบมือถือ USB เปิด **USB debugging** แล้วกดปุ่ม Run (▶) ใน Android Studio  
- หรือ **Tools → Device Manager → Create Device** สร้างอีมูเลเตอร์แล้วกด Run

---

## Build เป็น APK (สรุป)

1. แก้ `server.url` ใน `capacitor.config.json` ให้ชี้ไปที่ RabCheck จริง  
2. รัน `npx cap sync` แล้ว `npx cap open android`  
3. ใน Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**  
4. นำ `app-debug.apk` ไปติดตั้งบนมือถือ (อนุญาตการติดตั้งจากแหล่งที่ไม่รู้จักถ้า Android ถาม)

---

## แก้ปัญหา (Troubleshooting)

| อาการ | วิธีแก้ |
|--------|--------|
| **Minimum supported Gradle version is 8.6** | แก้ `android/gradle/wrapper/gradle-wrapper.properties` ให้ `distributionUrl` เป็น `gradle-8.6-all.zip` (หรือสูงกว่า) แล้วใน Android Studio กด **Sync Now** หรือ **File → Sync Project with Gradle Files** |
| **Incompatible Gradle JVM** / **Java 21** | โปรเจกต์ใช้ Gradle 8.6+ อยู่แล้ว — ถ้า Android Studio แนะนำ "Upgrade to Gradle 8.6 and re-sync" ให้กดลิงก์นั้น แล้ว sync ใหม่ |
| **หลัง npm install ขึ้น vulnerabilities** | ใช้ **`npm audit`** (ไม่ใช่ `npx audit`) เพื่อดูรายละเอียด จากนั้นลอง **`npm audit fix`** ก่อน |

---

## หมายเหตุ

- แอปใช้ได้เมื่อมือถือเข้าถึง URL ที่กำหนดได้ (WiFi เดียวกับคอม หรือเน็ตถ้าใช้ ngrok)
- ถ้าเปลี่ยน URL บ่อย (เช่น IP เปลี่ยน หรือรัน ngrok ใหม่) ต้องแก้ `capacitor.config.json` แล้วรัน `npx cap sync` แล้ว build APK ใหม่
- หน้าเว็บที่แสดงในแอปโหลดจากเซิร์ฟเวอร์โดยตรง — การอัปเดตในโฟลเดอร์ `frontend` ของโปรเจกต์ RabCheck จะมีผลทันทีเมื่อเปิดแอป (ไม่ต้อง build APK ใหม่เพื่อเห็นการแก้ไขหน้าเว็บ)
