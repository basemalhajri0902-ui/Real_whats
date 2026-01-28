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
    welcome: `مرحباً بك في منصة عقاري! 🏠

أنا هنا لمساعدتك في:
1️⃣ شراء عقار
2️⃣ تأجير عقار
3️⃣ عرض عقار للبيع
4️⃣ التحدث مع مسوق

اختر الرقم المناسب 👇`,

    askPropertyType: `ممتاز! 🏠
ما نوع العقار الذي تبحث عنه؟

• فيلا
• شقة
• أرض
• دوبلكس
• استوديو`,

    askCity: `رائع! 📍
في أي مدينة تبحث؟

• الرياض
• جدة
• مكة
• الدمام
• الخبر
• أخرى (اكتب اسم المدينة)`,

    askBudget: `ممتاز! 💰
ما هي ميزانيتك المتوقعة؟

مثال: 1000000 - 2000000
أو اكتب الحد الأقصى فقط`,

    searchingProperties: `جاري البحث عن العقارات المناسبة... 🔍`,

    noPropertiesFound: `للأسف لم نجد عقارات مطابقة حالياً 😔

سيتم إبلاغك فوراً عند توفر عقارات مناسبة.
هل تريد التحدث مع مسوق متخصص؟

• نعم
• لا`,

    connectingToMarketer: `جاري توصيلك بأفضل مسوق متخصص... 👨‍💼`,

    marketerConnected: (marketerName, phone) =>
        `تم! ✅
سيتواصل معك المسوق ${marketerName}
رقم التواصل: ${phone}

شكراً لاستخدامك منصة عقاري 🏠`,

    // رسائل إضافة عقار
    addPropertyStart: `تمام! 📝
سأساعدك في إضافة عقارك.

ما نوع العقار؟
• فيلا
• شقة
• أرض
• دوبلكس`,

    askPropertyLocation: `ممتاز! 📍
أرسل لي موقع العقار:
• المدينة
• الحي

مثال: الرياض، حي النرجس`,

    askPropertyPrice: `رائع! 💰
ما هو سعر العقار؟

اكتب السعر بالأرقام فقط (بالريال)`,

    askPropertyArea: `ممتاز! 📐
ما هي مساحة العقار بالمتر المربع؟`,

    askPropertyRooms: `كم عدد غرف النوم والحمامات؟

مثال: 4 غرف، 3 حمامات`,

    askPropertyImages: `📸 الآن أرسل صور العقار
(يمكنك إرسال حتى 10 صور)

أرسل "تم" عند الانتهاء`,

    propertyAdded: (code) =>
        `✅ تم إضافة عقارك بنجاح!

كود العقار: ${code}

سيتم مراجعته ونشره قريباً.
شكراً لاستخدامك منصة عقاري 🏠`,

    invalidInput: `عذراً، لم أفهم طلبك 🤔
يرجى اختيار أحد الخيارات المتاحة أو كتابة "قائمة" للعودة للقائمة الرئيسية.`,

    mainMenu: `القائمة الرئيسية 📋

1️⃣ شراء عقار
2️⃣ تأجير عقار
3️⃣ عرض عقار للبيع
4️⃣ التحدث مع مسوق
5️⃣ البحث برقم العقار

اختر الرقم المناسب 👇`
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
        if (text === '1' || text.includes('شراء')) {
            return {
                text: MESSAGES.askPropertyType,
                newState: { state: CONVERSATION_STATES.WAITING_PROPERTY_TYPE, intent: 'buy' }
            };
        }

        if (text === '2' || text.includes('تأجير') || text.includes('إيجار')) {
            return {
                text: MESSAGES.askPropertyType,
                newState: { state: CONVERSATION_STATES.WAITING_PROPERTY_TYPE, intent: 'rent' }
            };
        }

        if (text === '3' || text.includes('عرض') || text.includes('بيع')) {
            return {
                text: MESSAGES.addPropertyStart,
                newState: { state: CONVERSATION_STATES.WAITING_PROPERTY_TYPE, intent: 'sell' }
            };
        }

        if (text === '4' || text.includes('مسوق') || text.includes('تحدث')) {
            return this.connectToMarketer(customer);
        }

        return { text: MESSAGES.invalidInput };
    }

    /**
     * معالجة نوع العقار
     */
    handlePropertyType(text, state) {
        const types = {
            'فيلا': 'فيلا',
            'فله': 'فيلا',
            'villa': 'فيلا',
            'شقة': 'شقة',
            'شقه': 'شقة',
            'apartment': 'شقة',
            'أرض': 'أرض',
            'ارض': 'أرض',
            'land': 'أرض',
            'دوبلكس': 'دوبلكس',
            'duplex': 'دوبلكس',
            'استوديو': 'استوديو',
            'studio': 'استوديو'
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
        const cities = {
            'الرياض': 'الرياض',
            'رياض': 'الرياض',
            'riyadh': 'الرياض',
            'جدة': 'جدة',
            'جده': 'جدة',
            'jeddah': 'جدة',
            'مكة': 'مكة',
            'مكه': 'مكة',
            'mecca': 'مكة',
            'الدمام': 'الدمام',
            'دمام': 'الدمام',
            'dammam': 'الدمام',
            'الخبر': 'الخبر',
            'خبر': 'الخبر',
            'khobar': 'الخبر'
        };

        const city = cities[text] || text; // إذا لم يُعرف، استخدم النص كما هو

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
