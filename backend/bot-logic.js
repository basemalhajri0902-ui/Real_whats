/**
 * ========================================
 * منطق البوت الذكي - Bot Logic
 * ========================================
 * يتعامل مع رسائل واتساب ويولد الردود المناسبة
 */

const { supabase } = require('./supabase-client');

// ========================================
// حالات المحادثة
// ========================================
const CONVERSATION_STATES = {
    WELCOME: 'welcome',
    WAITING_INTENT: 'waiting_intent',
    WAITING_PROPERTY_TYPE: 'waiting_property_type',
    WAITING_CITY: 'waiting_city',
    WAITING_BUDGET: 'waiting_budget',
    WAITING_PROPERTY_DETAILS: 'waiting_property_details',
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

    askPropertyRooms: `🛏️ *مواصفات العقار*

اكتب التفاصيل:
• عدد الغرف
• عدد الحمامات
• المميزات (مسبح، حديقة، مصعد...)

مثال: 4 غرف، 3 حمامات، مسبح، حديقة

0️⃣ رجوع`,

    askPropertyImages: `📸 *صور العقار*

• أرسل صور واضحة للعقار
• حد أقصى 10 صور
• يُفضل: الواجهة، الصالة، الغرف، المطبخ

أرسل الصور ثم اكتب "تم"

0️⃣ إلغاء`,

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
        const text = message.toLowerCase().trim();
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
     * معالجة الصور المرفقة
     */
    async handleImages(mediaUrl, state, customer) {
        if (!mediaUrl) {
            return { text: 'يرجى إرسال صورة للعقار 📸' };
        }

        // حفظ رابط الصورة
        const images = state.images || [];
        images.push(mediaUrl);

        if (images.length >= 10) {
            return this.finalizeProperty(state, customer);
        }

        return {
            text: `تم استلام الصورة ${images.length}/10 ✅\n\nأرسل صورة أخرى أو اكتب "تم" للانتهاء`,
            newState: { ...state, images }
        };
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
