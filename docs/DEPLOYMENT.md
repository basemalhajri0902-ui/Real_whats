# 🚀 دليل النشر - Deployment Guide

## Backend Deployment

### الخيار 1: Railway (الأسهل)

1. أنشئ حساب على [railway.app](https://railway.app)
2. اربط GitHub repository
3. حدد مجلد `backend`
4. أضف Environment Variables
5. Deploy!

### الخيار 2: Render

1. أنشئ حساب على [render.com](https://render.com)
2. New → Web Service
3. حدد Repository
4. Build Command: `npm install`
5. Start Command: `npm start`

### الخيار 3: VPS (DigitalOcean/Hetzner)

```bash
# على السيرفر
git clone <repo>
cd backend
npm install
npm install -g pm2
pm2 start server.js --name "whats-real-api"
```

## Frontend Deployment

### الخيار 1: Vercel (الموصى به)

1. أنشئ حساب على [vercel.com](https://vercel.com)
2. Import Git Repository
3. Root Directory: `dashboard`
4. Framework: Next.js
5. أضف Environment Variables
6. Deploy!

### الخيار 2: Netlify

```bash
# في مجلد dashboard
npm run build
# ارفع مجلد .next على Netlify
```

## Environment Variables

### Backend (Production)
```env
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
WASENDER_API_KEY=xxx
WASENDER_INSTANCE_ID=xxx
```

### Frontend (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## إعداد Domain

### للـ Backend
1. أضف Custom Domain في منصة الاستضافة
2. حدّث DNS Records
3. حدّث Webhook URL في Wasender

### للـ Frontend
1. أضف Custom Domain في Vercel
2. حدّث DNS Records

## SSL/HTTPS

معظم المنصات توفر SSL مجاني تلقائياً:
- ✅ Vercel
- ✅ Railway
- ✅ Render

## المراقبة والتنبيهات

### Sentry (للأخطاء)
```javascript
// في server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
```

### UptimeRobot (للتوافر)
1. أنشئ حساب على uptimerobot.com
2. أضف Monitor جديد
3. URL: `https://your-api.com/health`

## قائمة التحقق قبل الإطلاق

- [ ] Environment Variables صحيحة
- [ ] Supabase في Production Mode
- [ ] Wasender Webhook محدث
- [ ] SSL/HTTPS يعمل
- [ ] Backup قاعدة البيانات مفعّل
- [ ] Monitoring مفعّل
- [ ] Rate Limiting مفعّل
