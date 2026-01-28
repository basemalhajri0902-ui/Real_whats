# 📱 دليل إعداد Wasender

## ما هو Wasender؟

Wasender هو خدمة API للتواصل عبر واتساب، تتيح لك:
- استقبال رسائل واتساب
- إرسال رسائل نصية وصور
- إرسال رسائل تفاعلية (أزرار وقوائم)

## الخطوة 1: إنشاء حساب

1. اذهب إلى [wasender.com](https://wasender.com)
2. أنشئ حساب جديد
3. اختر الخطة المناسبة

## الخطوة 2: ربط رقم واتساب

1. في لوحة التحكم، اضغط "Create Instance"
2. امسح QR Code بهاتفك من واتساب
3. انتظر حتى يصبح الحالة "Connected"

## الخطوة 3: الحصول على المفاتيح

1. اذهب إلى **API Settings**
2. انسخ:
   - **API Key**: مفتاح الـ API
   - **Instance ID**: معرف الـ instance

## الخطوة 4: إعداد Webhook

1. اذهب إلى **Webhook Settings**
2. أضف:
   ```
   Webhook URL: https://your-server.com/webhook/wasender
   Events: message.received
   ```

## الخطوة 5: اختبار الاتصال

```bash
# اختبار إرسال رسالة
curl -X POST "https://api.wasender.com/v1/messages/send" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Instance-ID: YOUR_INSTANCE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "966XXXXXXXXX",
    "message": "مرحباً! هذه رسالة تجريبية"
  }'
```

## إعداد في المشروع

### 1. تحديث .env

```env
WASENDER_API_URL="https://api.wasender.com"
WASENDER_API_KEY="your-api-key"
WASENDER_INSTANCE_ID="your-instance-id"
WASENDER_WEBHOOK_SECRET="your-secret"
```

### 2. تشغيل الخادم

```bash
cd backend
npm run dev
```

### 3. اختبار Webhook محلياً

استخدم ngrok لاختبار محلي:

```bash
ngrok http 3001
# انسخ الرابط وأضفه في إعدادات Wasender
```

## 📝 أنواع الرسائل

### رسالة نصية
```javascript
await sendWhatsAppMessage(phone, 'مرحباً!');
```

### رسالة مع صورة
```javascript
await sendWhatsAppImage(phone, imageUrl, 'وصف الصورة');
```

### أزرار تفاعلية
```javascript
await sendInteractiveButtons(phone, 'اختر خيار:', [
  'شراء',
  'تأجير',
  'استفسار'
]);
```

## 🔧 استكشاف الأخطاء

### "Instance not connected"
- افتح واتساب على الهاتف
- أعد مسح QR Code

### "Rate limit exceeded"
- انتظر الفترة المحددة
- راجع خطتك وترقيتها إذا لزم

### Webhook لا يستقبل
- تأكد من الرابط صحيح
- تأكد من HTTPS
- تحقق من السجلات (logs)
