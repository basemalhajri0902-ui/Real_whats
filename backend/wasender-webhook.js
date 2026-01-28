/**
 * ========================================
 * Wasender Webhook Handler
 * ========================================
 * يستقبل رسائل واتساب من Wasender ويرسل الردود
 */

const axios = require('axios');
const botLogic = require('./bot-logic');

// إعدادات Wasender
const WASENDER_API_URL = process.env.WASENDER_API_URL || 'https://api.wasenderapi.com';
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;
const WASENDER_INSTANCE_ID = process.env.WASENDER_INSTANCE_ID;
const WASENDER_BASE_URL = `${WASENDER_API_URL}/api/v1/instances/${WASENDER_INSTANCE_ID}`;

/**
 * معالجة رسالة واردة من Wasender
 */
async function handleIncomingMessage(req, res) {
    try {
        console.log('📨 Webhook received:', JSON.stringify(req.body, null, 2));

        // wasenderapi.com format - extract message data
        const data = req.body;

        // Try different payload formats
        let from, body, messageType;

        // Format 1: Direct message object
        if (data.key && data.message) {
            from = data.key.remoteJid?.replace('@s.whatsapp.net', '') || data.key.from;
            body = data.message.conversation ||
                data.message.extendedTextMessage?.text ||
                data.message.text ||
                '';
            messageType = 'text';
        }
        // Format 2: Nested in data object
        else if (data.data && data.data.key) {
            from = data.data.key.remoteJid?.replace('@s.whatsapp.net', '') || data.data.key.from;
            body = data.data.message?.conversation ||
                data.data.message?.extendedTextMessage?.text ||
                '';
            messageType = 'text';
        }
        // Format 3: Simple format
        else if (data.from || data.sender || data.phone) {
            from = data.from || data.sender || data.phone;
            body = data.body || data.message || data.text || '';
            messageType = data.messageType || data.type || 'text';
        }
        // Format 4: Messages array
        else if (data.messages && data.messages[0]) {
            const msg = data.messages[0];
            from = msg.from || msg.key?.remoteJid?.replace('@s.whatsapp.net', '');
            body = msg.body || msg.text || msg.message?.conversation || '';
            messageType = 'text';
        }
        else {
            console.log('⚠️ Unknown payload format, trying to extract...');
            from = data.from || data.sender || data.remoteJid || '';
            body = data.body || data.text || data.message || '';
        }

        // التحقق من صحة البيانات
        if (!from || !body) {
            console.log('⚠️ No valid message data found in payload');
            return res.status(200).json({ status: 'ignored', reason: 'no message data' });
        }

        // تنظيف رقم الهاتف
        const phone = cleanPhoneNumber(from);

        console.log(`📩 New message from ${phone}: ${body.substring(0, 100)}...`);

        // معالجة الرسالة بواسطة البوت
        const response = await botLogic.handleMessage(phone, body, null);

        // إرسال الرد
        if (response && response.text) {
            console.log(`📤 Sending reply to ${phone}: ${response.text.substring(0, 50)}...`);
            await sendWhatsAppMessage(phone, response.text);
        }

        // إذا كان هناك إشعار للمسوق
        if (response && response.notifyMarketer) {
            await sendWhatsAppMessage(
                response.notifyMarketer.phone,
                response.notifyMarketer.message
            );
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(200).json({ error: 'Internal error', message: error.message });
    }
}

/**
 * إرسال رسالة واتساب عبر Wasender
 */
async function sendWhatsAppMessage(to, message, mediaUrl = null) {
    try {
        const phone = cleanPhoneNumber(to);

        // Wasender API format
        const payload = {
            number: phone,
            text: message
        };

        const response = await axios.post(
            `https://www.wasenderapi.com/api/send-text/${WASENDER_INSTANCE_ID}`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${WASENDER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Message sent to ${to}`);
        return response.data;

    } catch (error) {
        console.error('Send message error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * إرسال رسالة مع صورة
 */
async function sendWhatsAppImage(to, imageUrl, caption = '') {
    try {
        const response = await axios.post(
            `${WASENDER_API_URL}/v1/messages/send-media`,
            {
                to: cleanPhoneNumber(to),
                mediaUrl: imageUrl,
                caption: caption,
                mediaType: 'image'
            },
            {
                headers: {
                    'Authorization': `Bearer ${WASENDER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-Instance-ID': WASENDER_INSTANCE_ID
                }
            }
        );

        console.log(`✅ Image sent to ${to}`);
        return response.data;

    } catch (error) {
        console.error('Send image error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * إرسال قائمة تفاعلية (Interactive List)
 */
async function sendInteractiveList(to, title, buttonText, sections) {
    try {
        const response = await axios.post(
            `${WASENDER_API_URL}/v1/messages/send-list`,
            {
                to: cleanPhoneNumber(to),
                title: title,
                buttonText: buttonText,
                sections: sections
            },
            {
                headers: {
                    'Authorization': `Bearer ${WASENDER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-Instance-ID': WASENDER_INSTANCE_ID
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error('Send list error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * إرسال أزرار تفاعلية
 */
async function sendInteractiveButtons(to, message, buttons) {
    try {
        const response = await axios.post(
            `${WASENDER_API_URL}/v1/messages/send-buttons`,
            {
                to: cleanPhoneNumber(to),
                message: message,
                buttons: buttons.map((btn, index) => ({
                    id: `btn_${index}`,
                    title: btn
                }))
            },
            {
                headers: {
                    'Authorization': `Bearer ${WASENDER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-Instance-ID': WASENDER_INSTANCE_ID
                }
            }
        );

        return response.data;

    } catch (error) {
        console.error('Send buttons error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * تنظيف رقم الهاتف
 */
function cleanPhoneNumber(phone) {
    if (!phone) return '';

    // إزالة كل شيء عدا الأرقام
    let cleaned = phone.replace(/\D/g, '');

    // التأكد من وجود رمز الدولة
    if (cleaned.startsWith('0')) {
        cleaned = '966' + cleaned.substring(1);
    } else if (!cleaned.startsWith('966')) {
        cleaned = '966' + cleaned;
    }

    return cleaned;
}

/**
 * التحقق من صحة webhook (للأمان)
 */
function verifyWebhook(req, res) {
    const token = req.query['verify_token'];
    const challenge = req.query['challenge'];

    const expectedToken = process.env.WASENDER_WEBHOOK_SECRET;

    if (token === expectedToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Webhook verification failed');
        res.status(403).send('Forbidden');
    }
}

/**
 * الحصول على حالة الاتصال
 */
async function getConnectionStatus() {
    try {
        // Check if API key and instance ID are configured
        if (!WASENDER_API_KEY || !WASENDER_INSTANCE_ID) {
            return { connected: false, error: 'Missing API credentials' };
        }

        // Try to get instance info from wasenderapi.com
        const response = await axios.get(
            `https://www.wasenderapi.com/api/sessions/${WASENDER_INSTANCE_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${WASENDER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );

        // If we get a response, consider connected
        return { connected: true, data: response.data };
    } catch (error) {
        console.error('Status check error:', error.response?.data || error.message);
        // If API key exists, assume configured but can't verify
        if (WASENDER_API_KEY && WASENDER_INSTANCE_ID) {
            return { connected: true, configured: true };
        }
        return { connected: false, error: error.message };
    }
}

module.exports = {
    handleIncomingMessage,
    sendWhatsAppMessage,
    sendWhatsAppImage,
    sendInteractiveList,
    sendInteractiveButtons,
    verifyWebhook,
    getConnectionStatus,
    cleanPhoneNumber
};
