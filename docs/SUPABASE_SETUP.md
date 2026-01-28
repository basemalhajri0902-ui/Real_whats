# 📖 دليل إعداد Supabase

## الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط "New Project"
4. اختر Organization
5. أدخل اسم المشروع: `whats-real`
6. اختر كلمة مرور قوية لقاعدة البيانات
7. اختر المنطقة الأقرب (مثل: Frankfurt أو Middle East)
8. اضغط "Create new project"

## الخطوة 2: الحصول على المفاتيح

من لوحة تحكم Supabase:

1. اذهب إلى **Settings** → **API**
2. انسخ:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon/public key**: للـ frontend
   - **service_role key**: للـ backend (سري!)

## الخطوة 3: إنشاء الجداول

### الطريقة 1: من SQL Editor

1. اذهب إلى **SQL Editor** في Supabase
2. افتح ملف `database/supabase-schema.sql`
3. انسخ المحتوى والصقه في SQL Editor
4. اضغط **Run**

### الطريقة 2: خطوة بخطوة

نفذ كل جزء على حدة إذا واجهت مشاكل.

## الخطوة 4: إضافة البيانات التجريبية

1. افتح ملف `database/seed-data.sql`
2. الصقه في SQL Editor
3. اضغط **Run**

## الخطوة 5: إعداد Storage

1. اذهب إلى **Storage** في Supabase
2. أنشئ الـ buckets التالية:
   - `properties` (Public)
   - `developers` (Public)
   - `marketers` (Public)
   - `documents` (Private)

## الخطوة 6: تفعيل Realtime

1. اذهب إلى **Database** → **Replication**
2. فعّل Realtime للجداول:
   - customers
   - properties
   - conversations

## الخطوة 7: التحقق

للتأكد من نجاح الإعداد:

```sql
-- تحقق من الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- تحقق من البيانات
SELECT COUNT(*) FROM properties;
SELECT COUNT(*) FROM marketers;
```

## 🔧 استكشاف الأخطاء

### خطأ: "permission denied"
- تأكد من استخدام `service_role` key في الـ backend

### خطأ: "relation does not exist"
- نفذ ملف `supabase-schema.sql` أولاً

### الـ Storage لا يعمل
- تأكد من إنشاء الـ buckets
- تحقق من سياسات الوصول (storage-policies.sql)
