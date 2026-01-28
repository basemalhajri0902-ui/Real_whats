# 🚀 Quick Start Guide - Ralf Wigand Method

## للمطورين الذين يريدون البدء فوراً

---

## ⚡ البدء في 5 دقائق

### 1️⃣ فهم النظام

هذا المشروع يستخدم **Ralf Wigand Method** - منهجية تطوير مستقلة:

```
📋 PROD.json       → قائمة المهام التفصيلية
📝 prompt.md       → تعليمات الـ AI Agent
📊 progress.txt    → سجل الإنجازات
⚙️ tech-stack.json → المعايير التقنية
🤖 AI Agent        → ينفذ المهام تلقائياً
```

---

### 2️⃣ التحقق من البيئة

```bash
# تأكد من تثبيت:
node --version   # يجب أن يكون 20.x+
npm --version
psql --version   # PostgreSQL 16+
redis-cli --version  # Redis 7.x+
git --version
```

---

### 3️⃣ استكشاف الملفات الرئيسية

```bash
cd /home/claude/realestate-tiktok-system

# اقرأ هذه الملفات بالترتيب:
cat README.md           # نظرة عامة
cat prompt.md           # تعليمات الـ Agent
cat tech-stack.json     # المعايير التقنية
cat PROD.json | head -50  # أول 50 سطر من المهام
cat progress.txt        # السجل
```

---

### 4️⃣ فهم PROD.json

كل مهمة في `PROD.json` تحتوي على:

```json
{
  "id": "SETUP-001",
  "phase": 1,
  "category": "Setup",
  "title": "Project Initialization",
  "priority": "P0",
  "completed": false,
  "dependencies": [],
  "technical_details": {
    "steps": [...],
    "deliverables": [...]
  },
  "acceptance_criteria": [...]
}
```

**الأولويات:**
- `P0` = Critical (MVP لا يعمل بدونها)
- `P1` = High (مهمة جداً)
- `P2` = Medium (تحسينات)
- `P3` = Low (Nice to have)

---

### 5️⃣ سير العمل (Workflow)

#### الطريقة اليدوية:

```bash
# 1. اقرأ PROD.json لاختيار المهمة التالية
# ابحث عن أول مهمة:
# - completed: false
# - كل dependencies مكتملة
# - أعلى priority

# 2. اقرأ prompt.md لفهم كيفية العمل

# 3. نفّذ المهمة

# 4. حدّث PROD.json:
# - غيّر completed إلى true
# - أضف completion_date

# 5. حدّث progress.txt بما أنجزته

# 6. Commit:
git add .
git commit -m "feat: [TASK-ID] Description"
```

#### الطريقة الأوتوماتيكية (Ralf Method):

```bash
# شغّل الـ Runner
cd scripts
./run-autonomous.sh 5  # يشتغل لـ 5 لفات

# الـ AI Agent سيعمل تلقائياً على المهام
```

---

## 📋 المهام الأولى (First 5 Tasks)

### Task 1: SETUP-001 - Project Initialization
**الوصف:** إعداد بيئة المشروع الكاملة  
**المدة المقدرة:** 2 ساعات  
**الأولوية:** P0  

**ما يجب فعله:**
```bash
# 1. إنشاء Git repo
git init
git remote add origin <your-repo-url>

# 2. إعداد Backend
mkdir -p backend/src/{models,routes,controllers,middleware,services,utils}
cd backend
npm init -y
npm install express typescript @types/express @types/node
npm install -D ts-node nodemon eslint prettier

# 3. إعداد Frontend
mkdir -p frontend
cd frontend
npx create-next-app@14 . --typescript --tailwind --app

# 4. إعداد Docker
# أنشئ docker-compose.yml

# 5. إعداد configs
# tsconfig.json, .eslintrc.js, .prettierrc
```

---

### Task 2: DB-001 - Database Schema
**الوصف:** تصميم schema كامل لقاعدة البيانات  
**المدة المقدرة:** 4 ساعات  
**الأولوية:** P0  

**ما يجب فعله:**
```bash
cd backend
npm install prisma @prisma/client
npx prisma init

# تعديل schema.prisma
# راجع PROD.json لقائمة الجداول المطلوبة
```

**الجداول الأساسية:**
- users
- user_profiles
- properties
- property_media
- property_videos
- bookings
- favorites
- comments
- companies
- company_members
- notifications

---

### Task 3: DB-002 - Migrations & Seed
**الوصف:** إنشاء migrations وبيانات تجريبية  
**المدة المقدرة:** 2 ساعات  
**الأولوية:** P0  

```bash
npx prisma migrate dev --name init
npx prisma generate

# إنشاء seed.ts
npx prisma db seed
```

---

### Task 4: AUTH-001 - Authentication
**الوصف:** نظام التسجيل والدخول  
**المدة المقدرة:** 6 ساعات  
**الأولوية:** P0  

**Dependencies:**
```bash
npm install bcrypt jsonwebtoken passport passport-jwt
npm install -D @types/bcrypt @types/jsonwebtoken @types/passport-jwt
```

**Endpoints المطلوبة:**
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- GET /api/v1/auth/me

---

### Task 5: AUTH-002 - JWT Middleware
**الوصف:** Middleware للتحقق من الصلاحيات  
**المدة المقدرة:** 3 ساعات  
**الأولوية:** P0  

**Middlewares المطلوبة:**
- authenticateToken
- requireRole
- optionalAuth

---

## 🎯 Tips للنجاح

### ✅ Do's:
1. **اقرأ المهمة 3 مرات** قبل البدء
2. **راجع progress.txt** لتتعلم من الأخطاء السابقة
3. **اختبر باستمرار** - لا تنتظر النهاية
4. **Commit باستمرار** - commits صغيرة أفضل
5. **وثّق كل شيء** في progress.txt

### ❌ Don'ts:
1. لا تنفذ أكثر من مهمة واحدة في نفس الوقت
2. لا تتخطى الـ dependencies
3. لا تنسى تحديث PROD.json
4. لا تكتب كود بدون تعليقات
5. لا تتجاهل الـ acceptance criteria

---

## 🐛 استكشاف الأخطاء

### المشكلة: "Cannot find module"
```bash
# الحل:
npm install
# أو
npm ci  # للـ clean install
```

### المشكلة: Database connection failed
```bash
# تأكد من:
1. PostgreSQL يعمل: sudo systemctl status postgresql
2. الـ credentials صحيحة في .env
3. Database موجودة: psql -l
```

### المشكلة: Port already in use
```bash
# اقتل الـ process:
lsof -ti:3000 | xargs kill -9  # للـ frontend
lsof -ti:5000 | xargs kill -9  # للـ backend
```

---

## 📊 متابعة التقدم

### طريقة سريعة لمعرفة Progress:

```bash
# عدد المهام الكلية:
grep -c '"id":' PROD.json

# عدد المهام المكتملة:
grep -c '"completed": true' PROD.json

# عدد المهام المتبقية:
grep -c '"completed": false' PROD.json

# المهمة الحالية:
grep -A 5 '"completed": false' PROD.json | head -6
```

---

## 🔗 موارد مفيدة

### Documentation:
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Tools:
- [Postman](https://www.postman.com/) - API testing
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Redis Commander](https://github.com/joeferner/redis-commander) - Redis GUI

---

## 💬 Need Help?

1. راجع `progress.txt` - ربما واجه شخص نفس المشكلة
2. راجع `prompt.md` - التعليمات موجودة هناك
3. راجع `tech-stack.json` - المعايير محددة
4. اقرأ الـ `acceptance_criteria` في PROD.json

---

## 🎉 الخطوة التالية

الآن أنت جاهز للبدء! اختر بين:

### Option 1: بدء يدوي
```bash
# ابدأ بـ Task SETUP-001
# اتبع الخطوات في PROD.json
```

### Option 2: بدء أوتوماتيكي (Ralf Method)
```bash
cd scripts
./run-autonomous.sh 10
# دع الـ AI يعمل!
```

---

**Good luck! 🚀**
