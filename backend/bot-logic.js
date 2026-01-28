/**
 * ========================================
 * منطق البوت الذكي - Bot Logic
 * ========================================
 * يتعامل مع رسائل واتساب ويولد الردود المناسبة
 */

const { supabase } = require('./supabase-client');

// ========================================
// دالة توحيد الأرقام العربية والإنجليزية
// ========================================
function normalizeArabicNumbers(text) {
    if (!text) return text;

    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let normalized = text.toString();

    // تحويل الأرقام العربية إلى إنجليزية
    for (let i = 0; i < arabicNumbers.length; i++) {
        normalized = normalized.replace(new RegExp(arabicNumbers[i], 'g'), englishNumbers[i]);
    }

    // تحويل الأرقام الفارسية أيضاً
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    for (let i = 0; i < persianNumbers.length; i++) {
        normalized = normalized.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
    }

    return normalized;
}

// ========================================
// حالات المحادثة
// ========================================
const CONVERSATION_STATES = {
    WELCOME: 'welcome',
    WAITING_INTENT: 'waiting_intent',
    WAITING_PROPERTY_TYPE: 'waiting_property_type',
    WAITING_CITY: 'waiting_city',
    WAITING_DISTRICT: 'waiting_district',
    WAITING_BUDGET: 'waiting_budget',
    // حالات إضافة عقار
    WAITING_ADD_TYPE: 'waiting_add_type', // بيع/إيجار
    WAITING_ADD_PROPERTY_TYPE: 'waiting_add_property_type',
    WAITING_ADD_LOCATION: 'waiting_add_location',
    WAITING_ADD_PRICE: 'waiting_add_price',
    WAITING_ADD_AREA: 'waiting_add_area',
    WAITING_ADD_SPECS: 'waiting_add_specs', // المواصفات الديناميكية
    WAITING_ADD_FEATURES: 'waiting_add_features',
    WAITING_ADD_MEDIA: 'waiting_add_media',
    // حالات أخرى
    WAITING_IMAGES: 'waiting_images',
    CONNECTED_TO_MARKETER: 'connected_to_marketer'
};

// ========================================
// الرسائل المعدة مسبقاً
// ========================================
const MESSAGES = {
    welcome: `أهلاً وسهلاً بك في *منصة عقاري* 🏠✨
الوجهة الأولى للعقارات في المملكة

اختر من القائمة التالية:

1️⃣ شراء عقار
2️⃣ إيجار عقار
3️⃣ بيع أو تأجير عقارك
4️⃣ تقييم عقار
5️⃣ التمويل العقاري
6️⃣ استشارة عقارية مجانية
7️⃣ تتبع طلباتي
0️⃣ المساعدة

📌 أرسل رقم الخيار`,

    askPropertyType: `اختر نوع العقار:

*سكني:*
1️⃣ فيلا
2️⃣ شقة
3️⃣ دوبلكس
4️⃣ تاون هاوس
5️⃣ استوديو

*استثماري:*
6️⃣ عمارة سكنية
7️⃣ أرض سكنية
8️⃣ أرض تجارية
9️⃣ محل تجاري
🔟 مكتب

0️⃣ رجوع

📌 أرسل رقم الخيار`,

    askCity: `اختر المنطقة:

*المنطقة الوسطى:*
1️⃣ الرياض
2️⃣ القصيم

*المنطقة الغربية:*
3️⃣ جدة
4️⃣ مكة المكرمة
5️⃣ المدينة المنورة
6️⃣ الطائف

*المنطقة الشرقية:*
7️⃣ الدمام
8️⃣ الخبر
9️⃣ الظهران
🔟 الأحساء

*أخرى:*
1️⃣1️⃣ مدينة أخرى

0️⃣ رجوع

📌 أرسل رقم الخيار أو اكتب اسم المدينة`,

    askDistrict: `اختر الحي أو اكتب اسمه:

📍 اكتب اسم الحي المطلوب
مثال: النرجس، الملقا، العليا

أو أرسل "الكل" للبحث في جميع الأحياء

0️⃣ رجوع`,

    askBudget: `حدد الميزانية 💰

اختر النطاق السعري:

1️⃣ أقل من 500,000 ريال
2️⃣ 500,000 - 1,000,000 ريال
3️⃣ 1,000,000 - 2,000,000 ريال
4️⃣ 2,000,000 - 3,000,000 ريال
5️⃣ 3,000,000 - 5,000,000 ريال
6️⃣ أكثر من 5,000,000 ريال
7️⃣ إدخال مبلغ محدد

0️⃣ رجوع

📌 أرسل رقم الخيار`,

    askArea: `حدد المساحة المطلوبة 📐

1️⃣ أقل من 200 م²
2️⃣ 200 - 300 م²
3️⃣ 300 - 400 م²
4️⃣ 400 - 500 م²
5️⃣ 500 - 750 م²
6️⃣ أكثر من 750 م²
7️⃣ غير محدد

0️⃣ رجوع

📌 أرسل رقم الخيار`,

    askRooms: `حدد عدد الغرف 🛏️

1️⃣ غرفة واحدة
2️⃣ غرفتين
3️⃣ 3 غرف
4️⃣ 4 غرف
5️⃣ 5 غرف
6️⃣ 6 غرف أو أكثر
7️⃣ غير محدد

0️⃣ رجوع

📌 أرسل رقم الخيار`,

    searchingProperties: `🔍 *جاري البحث...*

نبحث لك عن أفضل العقارات المتاحة
يرجى الانتظار...`,

    noPropertiesFound: `📭 *لم نجد عقارات مطابقة*

لا تقلق! لدينا خيارات أخرى:

1️⃣ تعديل معايير البحث
2️⃣ توسيع نطاق البحث
3️⃣ حفظ البحث والإشعار عند التوفر
4️⃣ استشارة مستشار عقاري
5️⃣ عقارات قريبة من معاييرك

0️⃣ القائمة الرئيسية

📌 أرسل رقم الخيار`,

    connectingToMarketer: `⏳ *جاري التوصيل...*

نختار لك أفضل مستشار متخصص في منطقتك...`,

    marketerConnected: (marketerName, phone) =>
        `✅ *تم التوصيل بنجاح!*

مستشارك العقاري:
━━━━━━━━━━━━━
👤 *الاسم:* ${marketerName}
📱 *الجوال:* ${phone}
⭐ *التقييم:* ممتاز
━━━━━━━━━━━━━

سيتواصل معك خلال 15 دقيقة

شكراً لثقتك بـ *منصة عقاري* 🏠`,

    // خدمات إضافة العقار
    addPropertyStart: `📝 *إضافة عقار جديد*

اختر نوع الإعلان:

1️⃣ بيع عقار
2️⃣ تأجير عقار
3️⃣ استثمار/شراكة

0️⃣ رجوع

� أرسل رقم الخيار`,

    addPropertyType: `اختر نوع العقار:

*سكني:*
1️⃣ فيلا
2️⃣ شقة
3️⃣ دوبلكس
4️⃣ أرض

*تجاري:*
5️⃣ عمارة
6️⃣ محل
7️⃣ مكتب

0️⃣ رجوع

📌 أرسل رقم الخيار`,

    askPropertyLocation: `📍 *موقع العقار*

أرسل الموقع بأحد الطرق:

1️⃣ مشاركة موقع GPS
2️⃣ كتابة العنوان
   مثال: الرياض، حي النرجس، شارع الأمير

0️⃣ رجوع`,

    askPropertyPrice: `💰 *سعر العقار*

اكتب السعر بالريال:
• للبيع: السعر الإجمالي
• للإيجار: الإيجار السنوي

مثال: 1500000

0️⃣ رجوع`,

    askPropertyArea: `📐 *مساحة العقار*

اكتب المساحة بالمتر المربع
مثال: 350

0️⃣ رجوع`,

    // ========================================
    // المواصفات الديناميكية حسب نوع العقار
    // ========================================

    // 🏠 فيلا / دوبلكس / تاون هاوس
    specsVilla: `🏠 *مواصفات الفيلا*

📐 *المساحات:*
أرسل: مساحة الأرض، مساحة البناء
مثال: 450، 350

0️⃣ رجوع`,

    specsVillaRooms: `🛏️ *الغرف والمرافق:*

أرسل بالترتيب:
غرف نوم، حمامات، صالات، مطابخ
مثال: 5، 4، 2، 1

0️⃣ رجوع`,

    specsVillaDetails: `🏗️ *تفاصيل البناء:*

أرسل بالترتيب:
عدد الأدوار، عمر البناء (سنوات)، الواجهة
مثال: 3، 5، شمالية

0️⃣ رجوع`,

    specsVillaFeatures: `✨ *مميزات الفيلا:*

اختر المميزات المتوفرة (أرسل الأرقام):

1️⃣ مسبح            2️⃣ حديقة
3️⃣ مصعد            4️⃣ سطح مستقل
5️⃣ ملحق خارجي      6️⃣ غرفة سائق
7️⃣ غرفة خادمة      8️⃣ مجلس خارجي
9️⃣ تكييف مركزي     🔟 مطبخ جاهز

مثال: 1، 2، 5، 9

أو اكتب المميزات نصاً
0️⃣ تخطي`,

    // 🏢 شقة / استوديو
    specsApartment: `🏢 *مواصفات الشقة*

📐 *المساحة:*
أرسل المساحة بالمتر المربع
مثال: 150

0️⃣ رجوع`,

    specsApartmentRooms: `🛏️ *الغرف:*

أرسل بالترتيب:
غرف نوم، حمامات، صالة
مثال: 3، 2، 1

0️⃣ رجوع`,

    specsApartmentDetails: `🏗️ *تفاصيل الشقة:*

أرسل بالترتيب:
رقم الدور، إجمالي الأدوار، عمر البناء
مثال: 3، 5، 2

0️⃣ رجوع`,

    specsApartmentFeatures: `✨ *مميزات الشقة:*

اختر المميزات (أرسل الأرقام):

1️⃣ مصعد            2️⃣ موقف سيارة
3️⃣ مدخل مستقل      4️⃣ بلكونة
5️⃣ تكييف مركزي     6️⃣ سبليت
7️⃣ مطبخ جاهز       8️⃣ مفروشة
9️⃣ دش مركزي       🔟 خزان مستقل

مثال: 1، 2، 4، 6

0️⃣ تخطي`,

    // 🏗️ عمارة سكنية
    specsBuilding: `🏗️ *مواصفات العمارة*

📐 *المساحات:*
أرسل: مساحة الأرض، مساحة البناء
مثال: 600، 2000

0️⃣ رجوع`,

    specsBuildingDetails: `🏢 *تفاصيل العمارة:*

أرسل بالترتيب:
عدد الأدوار، عدد الشقق، عدد المحلات، عمر البناء
مثال: 4، 12، 2، 10

0️⃣ رجوع`,

    specsBuildingIncome: `💰 *الدخل:*

أرسل بالترتيب:
الدخل السنوي (ريال)، نسبة التأجير %
مثال: 250000، 90

0️⃣ تخطي`,

    specsBuildingFeatures: `✨ *مميزات العمارة:*

اختر المميزات (أرسل الأرقام):

1️⃣ مصعد            2️⃣ مواقف سيارات
3️⃣ حارس            4️⃣ خزانات مياه
5️⃣ مكيفات          6️⃣ صك إلكتروني
7️⃣ رخصة بناء       8️⃣ مؤجرة بالكامل

مثال: 1، 2، 6

0️⃣ تخطي`,

    // 🌍 أرض
    specsLand: `🌍 *مواصفات الأرض*

📐 *المساحة:*
أرسل المساحة بالمتر المربع
مثال: 750

0️⃣ رجوع`,

    specsLandDetails: `📍 *تفاصيل الأرض:*

أرسل بالترتيب:
عرض الشارع (متر)، عدد الشوارع، الواجهة
مثال: 20، 2، شمالية

0️⃣ رجوع`,

    specsLandFeatures: `✨ *مميزات الأرض:*

اختر المميزات (أرسل الأرقام):

1️⃣ زاوية            2️⃣ على شارعين
3️⃣ على ثلاث شوارع  4️⃣ مسورة
5️⃣ صك إلكتروني     6️⃣ رخصة بناء
7️⃣ قريبة من خدمات  8️⃣ داخل حي راقي

مثال: 1، 5، 7

0️⃣ تخطي`,

    // 🏪 محل / مكتب
    specsCommercial: `🏪 *مواصفات المحل/المكتب*

📐 *المساحة:*
أرسل: المساحة (م²)، طول الواجهة (متر)
مثال: 80، 6

0️⃣ رجوع`,

    specsCommercialDetails: `📍 *التفاصيل:*

أرسل بالترتيب:
رقم الدور، على شارع رئيسي (نعم/لا)
مثال: ارضي، نعم

0️⃣ رجوع`,

    specsCommercialFeatures: `✨ *المميزات:*

اختر (أرسل الأرقام):

1️⃣ واجهة زجاجية    2️⃣ تكييف
3️⃣ حمام خاص        4️⃣ مستودع
5️⃣ موقف سيارات     6️⃣ لوحة إعلانية
7️⃣ كهرباء تجارية   8️⃣ ديكور جاهز

مثال: 1، 2، 3

0️⃣ تخطي`,

    askPropertyImages: `📸 *وسائط العقار*

أرسل صور وفيديوهات العقار:

*الصور:* 📷
• حد أقصى 10 صور
• يُفضل: الواجهة، الصالة، الغرف، المطبخ

*الفيديو:* 🎥
• أرسل فيديو قصير (حتى 2 دقيقة)
• أو أرسل رابط يوتيوب/تيك توك

*روابط إضافية:* 🔗
• رابط موقع العقار على الخريطة
• رابط جولة افتراضية (إن وجد)

أرسل الملفات والروابط، ثم اكتب *"تم"*

0️⃣ إلغاء`,

    askPropertyVideo: `🎥 *فيديو العقار (اختياري)*

1️⃣ أرسل فيديو مباشر
2️⃣ أرسل رابط يوتيوب
3️⃣ أرسل رابط تيك توك
4️⃣ أرسل رابط إنستغرام
5️⃣ تخطي هذه الخطوة

0️⃣ رجوع`,

    askPropertyLinks: `🔗 *روابط إضافية (اختياري)*

أرسل أي روابط مفيدة:
• موقع العقار على Google Maps
• جولة افتراضية 360°
• صفحة العقار على موقع آخر

أو اكتب *"تخطي"* للمتابعة

0️⃣ رجوع`,

    propertyAdded: (code) =>
        `✅ *تم استلام طلبك!*

━━━━━━━━━━━━━
📋 *رقم الطلب:* ${code}
📅 *الحالة:* قيد المراجعة
⏳ *المدة المتوقعة:* 24 ساعة
━━━━━━━━━━━━━

سنرسل لك إشعاراً فور النشر.

*لمتابعة طلبك:*
أرسل "تتبع ${code}"

شكراً لثقتك بـ *منصة عقاري* 🏠`,

    // خدمة التقييم
    valuationService: `📊 *خدمة تقييم العقارات*

احصل على تقييم دقيق لعقارك من خبرائنا

1️⃣ تقييم مجاني (تقديري)
2️⃣ تقييم معتمد (من مقيّم معتمد)
3️⃣ تقييم للتمويل البنكي

0️⃣ رجوع

📌 أرسل رقم الخيار`,

    // خدمة التمويل
    financingService: `🏦 *خدمات التمويل العقاري*

نساعدك في الحصول على أفضل عروض التمويل

1️⃣ حساب القسط الشهري
2️⃣ مقارنة عروض البنوك
3️⃣ استشارة تمويلية مجانية
4️⃣ متطلبات التمويل

0️⃣ رجوع

📌 أرسل رقم الخيار`,

    mortgageCalculator: `🔢 *حاسبة التمويل*

أدخل المبلغ المطلوب تمويله بالريال:
مثال: 1000000

0️⃣ رجوع`,

    mortgageResult: (amount, monthly, years) =>
        `📊 *نتيجة الحساب*

━━━━━━━━━━━━━
💰 *مبلغ التمويل:* ${amount} ريال
📅 *المدة:* ${years} سنة
💳 *القسط الشهري:* ~${monthly} ريال
━━━━━━━━━━━━━

⚠️ القسط تقريبي ويختلف حسب البنك

1️⃣ مقارنة عروض البنوك
2️⃣ استشارة تمويلية
3️⃣ حساب مبلغ آخر

0️⃣ القائمة الرئيسية`,

    // تتبع الطلبات
    trackOrders: `📋 *تتبع طلباتي*

اختر نوع الطلب:

1️⃣ طلبات البحث عن عقار
2️⃣ عقاراتي المعروضة
3️⃣ طلبات التقييم
4️⃣ طلبات التمويل
5️⃣ البحث برقم الطلب

0️⃣ رجوع

📌 أرسل رقم الخيار`,

    noOrders: `📭 لا توجد طلبات حالياً

1️⃣ إنشاء طلب جديد
0️⃣ القائمة الرئيسية`,

    // رسائل النظام
    invalidInput: `⚠️ *خيار غير صحيح*

يرجى اختيار رقم من القائمة المتاحة
أو اكتب *"قائمة"* للعودة للقائمة الرئيسية`,

    mainMenu: `*القائمة الرئيسية* 📋

1️⃣ شراء عقار
2️⃣ إيجار عقار
3️⃣ بيع/تأجير عقارك
4️⃣ تقييم عقار
5️⃣ التمويل العقاري
6️⃣ استشارة مجانية
7️⃣ تتبع طلباتي
0️⃣ المساعدة

📌 أرسل رقم الخيار`,

    help: `❓ *مركز المساعدة*

1️⃣ كيف أبحث عن عقار؟
2️⃣ كيف أعرض عقاري للبيع؟
3️⃣ خدمة التقييم العقاري
4️⃣ التمويل العقاري
5️⃣ الأسئلة الشائعة
6️⃣ الشروط والأحكام
7️⃣ تواصل مع الدعم الفني
0️⃣ القائمة الرئيسية

📌 أرسل رقم الخيار`,

    helpSearch: `🔍 *كيف أبحث عن عقار؟*

1️⃣ اختر "شراء" أو "إيجار"
2️⃣ حدد نوع العقار
3️⃣ اختر المدينة والحي
4️⃣ حدد الميزانية
5️⃣ ستظهر لك النتائج

💡 *نصيحة:* كلما حددت معايير أكثر، حصلت على نتائج أدق

0️⃣ رجوع`,

    helpSell: `📝 *كيف أعرض عقاري للبيع؟*

1️⃣ اختر "بيع/تأجير عقارك"
2️⃣ اختر نوع الإعلان
3️⃣ اختر نوع العقار
4️⃣ أدخل الموقع والسعر والمواصفات
5️⃣ أرسل الصور
6️⃣ سيتم مراجعة الإعلان ونشره

✅ *مجاناً:* النشر الأساسي
⭐ *مدفوع:* إعلان مميز في المقدمة

0️⃣ رجوع`,

    faq: `❓ *الأسئلة الشائعة*

1️⃣ هل الخدمة مجانية؟
2️⃣ كم تستغرق مراجعة الإعلان؟
3️⃣ هل يمكنني تعديل الإعلان؟
4️⃣ كيف أحذف إعلاني؟
5️⃣ ما هي العمولة؟
6️⃣ كيف أرفع إعلاني للمميز؟

0️⃣ رجوع

📌 أرسل رقم السؤال`,

    contactSupport: `📞 *الدعم الفني*

تواصل معنا:
━━━━━━━━━━━━━
📱 واتساب: 966500000000
✉️ البريد: support@aqari.sa
🕐 الدوام: 9 ص - 9 م
━━━━━━━━━━━━━

أو اكتب مشكلتك وسنرد عليك

0️⃣ رجوع`
};

// ========================================
// الكلاس الرئيسي للبوت
// ========================================
class BotLogic {

    /**
     * معالجة الرسالة الواردة
     */
    async handleMessage(phone, message, mediaUrl = null) {
        try {
            // 1. البحث عن العميل أو إنشاء جديد
            let customer = await this.getOrCreateCustomer(phone);

            // 2. حفظ الرسالة في المحادثات
            await this.saveConversation(phone, customer.id, 'incoming', message, mediaUrl);

            // 3. تحديد الرد المناسب
            const response = await this.generateResponse(customer, message, mediaUrl);

            // 4. حفظ رد البوت
            await this.saveConversation(phone, customer.id, 'outgoing', response.text);

            // 5. تحديث حالة العميل إذا تغيرت
            if (response.newState) {
                await this.updateCustomerState(customer.id, response.newState);
            }

            return response;

        } catch (error) {
            console.error('Bot error:', error);
            return {
                text: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
                error: true
            };
        }
    }

    /**
     * الحصول على العميل أو إنشاء جديد
     */
    async getOrCreateCustomer(phone) {
        // البحث عن العميل
        const { data: existing } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .single();

        if (existing) {
            return existing;
        }

        // إنشاء عميل جديد
        const { data: newCustomer, error } = await supabase
            .from('customers')
            .insert({
                phone,
                status: 'new',
                source: 'whatsapp'
            })
            .select()
            .single();

        if (error) {
            console.error('Create customer error:', error);
            throw error;
        }

        return newCustomer;
    }

    /**
     * حفظ المحادثة
     */
    async saveConversation(phone, customerId, messageType, text, mediaUrl = null) {
        const { error } = await supabase
            .from('conversations')
            .insert({
                customer_phone: phone,
                customer_id: customerId,
                message_type: messageType,
                message_text: text,
                media_url: mediaUrl,
                media_type: mediaUrl ? this.detectMediaType(mediaUrl) : null
            });

        if (error) {
            console.error('Save conversation error:', error);
        }
    }

    /**
     * تحديد نوع الوسائط
     */
    detectMediaType(url) {
        if (!url) return null;
        const lower = url.toLowerCase();
        if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
        if (lower.match(/\.(mp4|mov|avi)$/)) return 'video';
        if (lower.match(/\.(pdf|doc|docx)$/)) return 'document';
        return 'other';
    }

    /**
     * توليد الرد المناسب
     */
    async generateResponse(customer, message, mediaUrl) {
        // توحيد الأرقام العربية والإنجليزية
        const text = normalizeArabicNumbers(message).toLowerCase().trim();
        const state = customer.session_state || {};
        const currentState = state.state || CONVERSATION_STATES.WELCOME;

        // التحقق من الأوامر العامة
        if (this.isGreeting(text)) {
            return { text: MESSAGES.welcome, newState: { state: CONVERSATION_STATES.WAITING_INTENT } };
        }

        if (text === 'قائمة' || text === 'menu' || text === 'رجوع') {
            return { text: MESSAGES.mainMenu, newState: { state: CONVERSATION_STATES.WAITING_INTENT } };
        }

        // معالجة حسب الحالة الحالية
        switch (currentState) {
            case CONVERSATION_STATES.WELCOME:
            case CONVERSATION_STATES.WAITING_INTENT:
                return this.handleIntent(text, customer);

            case CONVERSATION_STATES.WAITING_PROPERTY_TYPE:
                return this.handlePropertyType(text, state);

            case CONVERSATION_STATES.WAITING_CITY:
                return this.handleCity(text, state);

            case CONVERSATION_STATES.WAITING_BUDGET:
                return this.handleBudget(text, state, customer);

            case CONVERSATION_STATES.WAITING_IMAGES:
                return this.handleImages(mediaUrl, state, customer);

            default:
                return { text: MESSAGES.welcome, newState: { state: CONVERSATION_STATES.WAITING_INTENT } };
        }
    }

    /**
     * التحقق من التحية
     */
    isGreeting(text) {
        const greetings = ['السلام عليكم', 'سلام', 'مرحبا', 'هلا', 'اهلا', 'hi', 'hello', 'هاي'];
        return greetings.some(g => text.includes(g));
    }

    /**
     * معالجة اختيار النية
     */
    async handleIntent(text, customer) {
        // خيار 0 = المساعدة
        if (text === '0' || text.includes('مساعدة') || text.includes('دعم')) {
            return { text: MESSAGES.help, newState: { state: CONVERSATION_STATES.WAITING_INTENT } };
        }

        // 1️⃣ شراء عقار
        if (text === '1' || text.includes('شراء')) {
            return {
                text: MESSAGES.askPropertyType,
                newState: { state: CONVERSATION_STATES.WAITING_PROPERTY_TYPE, intent: 'buy' }
            };
        }

        // 2️⃣ إيجار عقار
        if (text === '2' || text.includes('إيجار') || text.includes('تأجير')) {
            return {
                text: MESSAGES.askPropertyType,
                newState: { state: CONVERSATION_STATES.WAITING_PROPERTY_TYPE, intent: 'rent' }
            };
        }

        // 3️⃣ بيع/تأجير عقارك
        if (text === '3' || text.includes('بيع') || text.includes('عرض')) {
            return {
                text: MESSAGES.addPropertyStart,
                newState: { state: CONVERSATION_STATES.WAITING_PROPERTY_TYPE, intent: 'sell' }
            };
        }

        // 4️⃣ تقييم عقار
        if (text === '4' || text.includes('تقييم')) {
            return {
                text: MESSAGES.valuationService,
                newState: { state: CONVERSATION_STATES.WAITING_INTENT }
            };
        }

        // 5️⃣ التمويل العقاري
        if (text === '5' || text.includes('تمويل')) {
            return {
                text: MESSAGES.financingService,
                newState: { state: CONVERSATION_STATES.WAITING_INTENT }
            };
        }

        // 6️⃣ استشارة مجانية
        if (text === '6' || text.includes('استشارة') || text.includes('مستشار')) {
            return this.connectToMarketer(customer);
        }

        // 7️⃣ تتبع طلباتي
        if (text === '7' || text.includes('تتبع') || text.includes('طلباتي')) {
            return {
                text: MESSAGES.trackOrders,
                newState: { state: CONVERSATION_STATES.WAITING_INTENT }
            };
        }

        return { text: MESSAGES.invalidInput };
    }

    /**
     * معالجة نوع العقار
     */
    handlePropertyType(text, state) {
        // خيار 0 = رجوع
        if (text === '0') {
            return { text: MESSAGES.mainMenu, newState: { state: CONVERSATION_STATES.WAITING_INTENT } };
        }

        const types = {
            // سكني
            '1': 'فيلا',
            'فيلا': 'فيلا',
            'فله': 'فيلا',
            '2': 'شقة',
            'شقة': 'شقة',
            'شقه': 'شقة',
            '3': 'دوبلكس',
            'دوبلكس': 'دوبلكس',
            '4': 'تاون هاوس',
            'تاون': 'تاون هاوس',
            '5': 'استوديو',
            'استوديو': 'استوديو',
            // استثماري
            '6': 'عمارة سكنية',
            'عمارة': 'عمارة سكنية',
            '7': 'أرض سكنية',
            'أرض': 'أرض سكنية',
            'ارض': 'أرض سكنية',
            '8': 'أرض تجارية',
            '9': 'محل تجاري',
            'محل': 'محل تجاري',
            '10': 'مكتب',
            'مكتب': 'مكتب'
        };

        const propertyType = types[text] || null;

        if (propertyType) {
            return {
                text: MESSAGES.askCity,
                newState: { ...state, state: CONVERSATION_STATES.WAITING_CITY, propertyType }
            };
        }

        return { text: MESSAGES.askPropertyType };
    }

    /**
     * معالجة المدينة
     */
    handleCity(text, state) {
        // خيار 0 = رجوع
        if (text === '0') {
            return { text: MESSAGES.askPropertyType, newState: { ...state, state: CONVERSATION_STATES.WAITING_PROPERTY_TYPE } };
        }

        const cities = {
            // المنطقة الوسطى
            '1': 'الرياض',
            'الرياض': 'الرياض',
            'رياض': 'الرياض',
            '2': 'القصيم',
            'القصيم': 'القصيم',
            'قصيم': 'القصيم',
            // المنطقة الغربية
            '3': 'جدة',
            'جدة': 'جدة',
            'جده': 'جدة',
            '4': 'مكة المكرمة',
            'مكة': 'مكة المكرمة',
            'مكه': 'مكة المكرمة',
            '5': 'المدينة المنورة',
            'المدينة': 'المدينة المنورة',
            '6': 'الطائف',
            'الطائف': 'الطائف',
            'طائف': 'الطائف',
            // المنطقة الشرقية
            '7': 'الدمام',
            'الدمام': 'الدمام',
            'دمام': 'الدمام',
            '8': 'الخبر',
            'الخبر': 'الخبر',
            'خبر': 'الخبر',
            '9': 'الظهران',
            'الظهران': 'الظهران',
            'ظهران': 'الظهران',
            '10': 'الأحساء',
            'الأحساء': 'الأحساء',
            'الاحساء': 'الأحساء',
            'احساء': 'الأحساء'
        };

        // إذا اختار 7 = أخرى، أو كتب اسم مدينة
        const city = cities[text] || text;

        return {
            text: MESSAGES.askBudget,
            newState: { ...state, state: CONVERSATION_STATES.WAITING_BUDGET, city }
        };
    }

    /**
     * معالجة الميزانية والبحث
     */
    async handleBudget(text, state, customer) {
        // استخراج الأرقام من النص
        const numbers = text.match(/\d+/g);

        if (!numbers || numbers.length === 0) {
            return { text: MESSAGES.askBudget };
        }

        let budgetMin = 0;
        let budgetMax = parseInt(numbers[numbers.length - 1]);

        if (numbers.length >= 2) {
            budgetMin = parseInt(numbers[0]);
            budgetMax = parseInt(numbers[1]);
        }

        // تحديث بيانات العميل
        await supabase
            .from('customers')
            .update({
                city: state.city,
                preferred_property: state.propertyType,
                preferred_type: state.intent === 'rent' ? 'إيجار' : 'شراء',
                budget_min: budgetMin,
                budget_max: budgetMax,
                status: 'contacted'
            })
            .eq('id', customer.id);

        // البحث عن عقارات مناسبة
        const properties = await this.searchProperties(state.city, state.propertyType, budgetMin, budgetMax);

        if (properties.length > 0) {
            const propertyList = properties.slice(0, 5).map((p, i) =>
                `${i + 1}. ${p.title}\n   💰 ${p.price.toLocaleString()} ريال\n   📍 ${p.district || p.city}`
            ).join('\n\n');

            return {
                text: `وجدنا لك ${properties.length} عقار! 🎉\n\n${propertyList}\n\nأرسل رقم العقار للتفاصيل أو "مسوق" للتحدث مع متخصص`,
                newState: { ...state, state: CONVERSATION_STATES.WAITING_INTENT, properties }
            };
        }

        // لم نجد عقارات - ربط بمسوق
        return this.connectToMarketer(customer);
    }

    /**
     * البحث عن عقارات
     */
    async searchProperties(city, propertyType, budgetMin, budgetMax) {
        let query = supabase
            .from('properties')
            .select('*')
            .eq('status', 'available');

        if (city) {
            query = query.eq('city', city);
        }

        if (propertyType) {
            query = query.eq('property_type', propertyType);
        }

        if (budgetMax > 0) {
            query = query.lte('price', budgetMax);
        }

        if (budgetMin > 0) {
            query = query.gte('price', budgetMin);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Search error:', error);
            return [];
        }

        return data || [];
    }

    /**
     * ربط العميل بمسوق
     */
    async connectToMarketer(customer) {
        // البحث عن أفضل مسوق
        const { data: marketer } = await supabase
            .rpc('get_best_marketer', {
                p_city: customer.city,
                p_specialization: customer.preferred_property
            });

        if (marketer && marketer.length > 0) {
            const m = marketer[0];

            // تعيين المسوق للعميل
            await supabase
                .from('customers')
                .update({
                    assigned_marketer: m.marketer_id,
                    status: 'contacted'
                })
                .eq('id', customer.id);

            // تحديث عدد العملاء النشطين للمسوق
            await supabase
                .from('marketers')
                .update({ active_customers: m.active_customers + 1 })
                .eq('id', m.marketer_id);

            return {
                text: MESSAGES.marketerConnected(m.marketer_name, m.marketer_phone),
                newState: { state: CONVERSATION_STATES.CONNECTED_TO_MARKETER, marketerId: m.marketer_id },
                notifyMarketer: {
                    phone: m.marketer_phone,
                    message: `🔔 عميل جديد!\nالهاتف: ${customer.phone}\nالمدينة: ${customer.city || 'غير محدد'}\nالنوع: ${customer.preferred_property || 'غير محدد'}`
                }
            };
        }

        // لم نجد مسوق متاح
        return {
            text: `عذراً، جميع مسوقينا مشغولون حالياً 😔
سيتم التواصل معك في أقرب وقت.

شكراً لصبرك 🙏`,
            newState: { state: CONVERSATION_STATES.WAITING_INTENT }
        };
    }

    /**
     * معالجة الصور والوسائط المرفقة
     */
    async handleImages(mediaUrl, state, customer) {
        // حفظ رابط الوسائط
        const media = state.media || { images: [], videos: [], links: [] };

        if (mediaUrl) {
            // تحديد نوع الوسائط
            const lower = mediaUrl.toLowerCase();
            if (lower.match(/\.(jpg|jpeg|png|gif|webp)/) || lower.includes('image')) {
                media.images.push(mediaUrl);
            } else if (lower.match(/\.(mp4|mov|avi|webm)/) || lower.includes('video')) {
                media.videos.push(mediaUrl);
            } else if (lower.includes('youtube') || lower.includes('tiktok') || lower.includes('instagram') || lower.includes('maps.google')) {
                media.links.push(mediaUrl);
            } else {
                media.images.push(mediaUrl); // افتراضي = صورة
            }
        }

        const totalMedia = media.images.length + media.videos.length + media.links.length;

        if (totalMedia >= 10) {
            return this.finalizeProperty(state, customer, media);
        }

        return {
            text: `✅ تم استلام ${totalMedia} ملف

📷 صور: ${media.images.length}
🎥 فيديو: ${media.videos.length}
🔗 روابط: ${media.links.length}

أرسل المزيد أو اكتب *"تم"* للانتهاء`,
            newState: { ...state, media }
        };
    }

    /**
     * إتمام إضافة العقار وحفظه في قاعدة البيانات
     */
    async finalizeProperty(state, customer, media = null) {
        try {
            const propertyMedia = media || state.media || { images: [], videos: [], links: [] };

            // توليد كود فريد للعقار
            const propertyCode = this.generatePropertyCode();

            // تحضير بيانات العقار (تتوافق مع جدول properties في Supabase)
            const propertyData = {
                property_code: propertyCode,
                title: `${state.propertyType} في ${state.city}`,
                property_type: state.propertyType,
                transaction_type: state.intent === 'rent' ? 'rent' : 'sale',
                city: state.city,
                district: state.district || null,
                location: state.location || null,
                price: parseInt(state.price) || 0,
                // المساحات
                area: parseFloat(state.area) || null,
                land_area: parseFloat(state.landArea) || null,
                building_area: parseFloat(state.buildingArea) || null,
                // الغرف والمرافق
                bedrooms: parseInt(state.bedrooms) || null,
                bathrooms: parseInt(state.bathrooms) || null,
                living_rooms: parseInt(state.livingRooms) || null,
                kitchens: parseInt(state.kitchens) || null,
                // تفاصيل البناء
                floors: parseInt(state.floors) || null,
                floor_number: parseInt(state.floorNumber) || null,
                building_age: parseInt(state.buildingAge) || null,
                facade: state.facade || null,
                // تفاصيل العمارة
                units_count: parseInt(state.unitsCount) || null,
                shops_count: parseInt(state.shopsCount) || null,
                annual_income: parseFloat(state.annualIncome) || null,
                occupancy_rate: parseInt(state.occupancyRate) || null,
                // تفاصيل الأرض
                street_width: parseFloat(state.streetWidth) || null,
                streets_count: parseInt(state.streetsCount) || null,
                // تفاصيل تجاري
                facade_length: parseFloat(state.facadeLength) || null,
                is_main_street: state.isMainStreet || null,
                // المميزات
                features: state.features || [],
                description: state.description || `${state.propertyType} ${state.intent === 'rent' ? 'للإيجار' : 'للبيع'} في ${state.city}`,
                // الوسائط
                images: propertyMedia.images,
                videos: propertyMedia.videos,
                status: 'pending' // في انتظار المراجعة
            };

            // حفظ العقار في قاعدة البيانات
            const { data: property, error } = await supabase
                .from('properties')
                .insert(propertyData)
                .select()
                .single();

            if (error) {
                console.error('Property insert error:', error);
                return {
                    text: `عذراً، حدث خطأ في حفظ العقار 😔
يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.

0️⃣ القائمة الرئيسية`,
                    newState: { state: CONVERSATION_STATES.WAITING_INTENT }
                };
            }

            console.log(`✅ Property saved: ${propertyCode}`, property);

            return {
                text: MESSAGES.propertyAdded(propertyCode),
                newState: { state: CONVERSATION_STATES.WAITING_INTENT }
            };

        } catch (error) {
            console.error('Finalize property error:', error);
            return {
                text: `عذراً، حدث خطأ غير متوقع 😔
يرجى المحاولة مرة أخرى.

0️⃣ القائمة الرئيسية`,
                newState: { state: CONVERSATION_STATES.WAITING_INTENT }
            };
        }
    }

    /**
     * توليد كود فريد للعقار
     */
    generatePropertyCode() {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `PRO-${year}-${random}`;
    }

    /**
     * تحديد فئة العقار
     */
    getPropertyCategory(propertyType) {
        const villaTypes = ['فيلا', 'دوبلكس', 'تاون هاوس'];
        const apartmentTypes = ['شقة', 'استوديو'];
        const buildingTypes = ['عمارة سكنية', 'عمارة'];
        const landTypes = ['أرض سكنية', 'أرض تجارية', 'أرض'];
        const commercialTypes = ['محل تجاري', 'مكتب', 'محل'];

        if (villaTypes.includes(propertyType)) return 'villa';
        if (apartmentTypes.includes(propertyType)) return 'apartment';
        if (buildingTypes.includes(propertyType)) return 'building';
        if (landTypes.includes(propertyType)) return 'land';
        if (commercialTypes.includes(propertyType)) return 'commercial';
        return 'villa'; // افتراضي
    }

    /**
     * الحصول على رسالة المواصفات حسب الفئة والمرحلة
     */
    getSpecsMessage(category, step) {
        const specsFlow = {
            villa: ['specsVilla', 'specsVillaRooms', 'specsVillaDetails', 'specsVillaFeatures'],
            apartment: ['specsApartment', 'specsApartmentRooms', 'specsApartmentDetails', 'specsApartmentFeatures'],
            building: ['specsBuilding', 'specsBuildingDetails', 'specsBuildingIncome', 'specsBuildingFeatures'],
            land: ['specsLand', 'specsLandDetails', 'specsLandFeatures'],
            commercial: ['specsCommercial', 'specsCommercialDetails', 'specsCommercialFeatures']
        };

        const flow = specsFlow[category] || specsFlow.villa;
        const messageKey = flow[step] || flow[0];
        return MESSAGES[messageKey] || MESSAGES.specsVilla;
    }

    /**
     * تحويل أرقام المميزات إلى نصوص
     */
    parseFeatures(text, category) {
        const featuresMap = {
            villa: {
                '1': 'مسبح', '2': 'حديقة', '3': 'مصعد', '4': 'سطح مستقل',
                '5': 'ملحق خارجي', '6': 'غرفة سائق', '7': 'غرفة خادمة',
                '8': 'مجلس خارجي', '9': 'تكييف مركزي', '10': 'مطبخ جاهز'
            },
            apartment: {
                '1': 'مصعد', '2': 'موقف سيارة', '3': 'مدخل مستقل', '4': 'بلكونة',
                '5': 'تكييف مركزي', '6': 'سبليت', '7': 'مطبخ جاهز',
                '8': 'مفروشة', '9': 'دش مركزي', '10': 'خزان مستقل'
            },
            building: {
                '1': 'مصعد', '2': 'مواقف سيارات', '3': 'حارس', '4': 'خزانات مياه',
                '5': 'مكيفات', '6': 'صك إلكتروني', '7': 'رخصة بناء', '8': 'مؤجرة بالكامل'
            },
            land: {
                '1': 'زاوية', '2': 'على شارعين', '3': 'على ثلاث شوارع', '4': 'مسورة',
                '5': 'صك إلكتروني', '6': 'رخصة بناء', '7': 'قريبة من خدمات', '8': 'داخل حي راقي'
            },
            commercial: {
                '1': 'واجهة زجاجية', '2': 'تكييف', '3': 'حمام خاص', '4': 'مستودع',
                '5': 'موقف سيارات', '6': 'لوحة إعلانية', '7': 'كهرباء تجارية', '8': 'ديكور جاهز'
            }
        };

        const map = featuresMap[category] || featuresMap.villa;
        const numbers = text.match(/\d+/g) || [];
        const features = numbers.map(n => map[n]).filter(Boolean);

        // إذا لم توجد أرقام، استخدم النص كما هو
        if (features.length === 0 && text !== '0' && text !== 'تخطي') {
            return [text];
        }

        return features;
    }

    /**
     * تحديث حالة العميل
     */
    async updateCustomerState(customerId, newState) {
        await supabase
            .from('customers')
            .update({ session_state: newState })
            .eq('id', customerId);
    }
}

module.exports = new BotLogic();
