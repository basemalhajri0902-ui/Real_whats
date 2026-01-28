/**
 * ========================================
 * Express Server - الخادم الرئيسي
 * ========================================
 * نقطة الدخول للـ Backend مع Wasender + Supabase
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// الخدمات
const { supabase } = require('./supabase-client');
const wasender = require('./wasender-webhook');
const marketerAssignment = require('./marketer-assignment');

// إنشاء التطبيق
const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// Middleware
// ========================================
app.use(helmet()); // أمان
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('dev')); // تسجيل الطلبات
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// Health Check
// ========================================
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Whats Real API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', async (req, res) => {
    try {
        // فحص اتصال Supabase
        const { data, error } = await supabase.from('settings').select('key').limit(1);

        const wasenderStatus = await wasender.getConnectionStatus();

        res.json({
            status: 'healthy',
            supabase: error ? 'disconnected' : 'connected',
            wasender: wasenderStatus.connected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

// ========================================
// Wasender Webhook Routes
// ========================================

// التحقق من Webhook (GET)
app.get('/webhook/wasender', wasender.verifyWebhook);

// استقبال الرسائل (POST)
app.post('/webhook/wasender', wasender.handleIncomingMessage);

// ========================================
// API Routes - العقارات
// ========================================

// قائمة العقارات
app.get('/api/properties', async (req, res) => {
    try {
        const { city, type, minPrice, maxPrice, status, page = 1, limit = 20 } = req.query;

        let query = supabase
            .from('properties')
            .select('*, marketers(full_name, phone), developers(company_name)')
            .order('created_at', { ascending: false });

        if (city) query = query.eq('city', city);
        if (type) query = query.eq('property_type', type);
        if (status) query = query.eq('status', status);
        if (minPrice) query = query.gte('price', parseInt(minPrice));
        if (maxPrice) query = query.lte('price', parseInt(maxPrice));

        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// تفاصيل عقار
app.get('/api/properties/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*, marketers(*), developers(*)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        // زيادة عدد المشاهدات
        await supabase
            .from('properties')
            .update({ views_count: (data.views_count || 0) + 1 })
            .eq('id', req.params.id);

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// إضافة عقار جديد
app.post('/api/properties', async (req, res) => {
    try {
        const propertyData = req.body;

        // توليد كود العقار
        const { data: codeResult } = await supabase
            .rpc('generate_property_code', { p_city: propertyData.city });

        propertyData.property_code = codeResult || `PROP-${Date.now()}`;

        const { data, error } = await supabase
            .from('properties')
            .insert(propertyData)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// API Routes - العملاء
// ========================================

app.get('/api/customers', async (req, res) => {
    try {
        const { status, marketer, page = 1, limit = 20 } = req.query;

        let query = supabase
            .from('customers')
            .select('*, marketers(full_name, phone)')
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (marketer) query = query.eq('assigned_marketer', marketer);

        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// API Routes - المسوقين
// ========================================

app.get('/api/marketers', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('marketers')
            .select('*')
            .eq('is_active', true)
            .order('rating', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/marketers/:id/stats', async (req, res) => {
    try {
        const { data: marketer, error } = await supabase
            .from('marketers')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        // إحصائيات إضافية
        const { data: deals } = await supabase
            .from('deals')
            .select('*')
            .eq('marketer_id', req.params.id);

        const { data: customers } = await supabase
            .from('customers')
            .select('id, status')
            .eq('assigned_marketer', req.params.id);

        res.json({
            success: true,
            data: {
                ...marketer,
                total_deals: deals?.length || 0,
                completed_deals: deals?.filter(d => d.status === 'completed').length || 0,
                pending_deals: deals?.filter(d => d.status === 'pending').length || 0,
                total_customers: customers?.length || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// API Routes - الصفقات
// ========================================

app.get('/api/deals', async (req, res) => {
    try {
        const { status, marketer, page = 1, limit = 20 } = req.query;

        let query = supabase
            .from('deals')
            .select('*, properties(title, property_code), customers(full_name, phone), marketers(full_name)')
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (marketer) query = query.eq('marketer_id', marketer);

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// API Routes - الإحصائيات
// ========================================

app.get('/api/stats', async (req, res) => {
    try {
        // إجماليات
        const [properties, customers, marketers, deals] = await Promise.all([
            supabase.from('properties').select('id, status', { count: 'exact' }),
            supabase.from('customers').select('id, status', { count: 'exact' }),
            supabase.from('marketers').select('id', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('deals').select('id, status, deal_value, commission_amount')
        ]);

        const completedDeals = deals.data?.filter(d => d.status === 'completed') || [];
        const totalRevenue = completedDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
        const totalCommission = completedDeals.reduce((sum, d) => sum + (d.commission_amount || 0), 0);

        res.json({
            success: true,
            data: {
                total_properties: properties.count || 0,
                available_properties: properties.data?.filter(p => p.status === 'available').length || 0,
                total_customers: customers.count || 0,
                new_customers: customers.data?.filter(c => c.status === 'new').length || 0,
                active_marketers: marketers.count || 0,
                total_deals: deals.data?.length || 0,
                completed_deals: completedDeals.length,
                total_revenue: totalRevenue,
                total_commission: totalCommission
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// API Routes - المحادثات
// ========================================

app.get('/api/conversations', async (req, res) => {
    try {
        const { phone, limit = 50 } = req.query;

        let query = supabase
            .from('conversations')
            .select('*, customers(full_name)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (phone) {
            query = query.eq('customer_phone', phone);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// إرسال رسالة يدوياً
app.post('/api/conversations/send', async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ success: false, error: 'Phone and message required' });
        }

        await wasender.sendWhatsAppMessage(phone, message);

        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// Error Handler
// ========================================
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ========================================
// Start Server
// ========================================
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║   🏠 Whats Real API Server Started    ║
  ╠═══════════════════════════════════════╣
  ║   Port: ${PORT}                          ║
  ║   Env:  ${process.env.NODE_ENV || 'development'}                  ║
  ╚═══════════════════════════════════════╝
  
  📍 Endpoints:
  - GET  /health          - Health check
  - POST /webhook/wasender - WhatsApp webhook
  - GET  /api/properties   - List properties
  - GET  /api/customers    - List customers
  - GET  /api/marketers    - List marketers
  - GET  /api/deals        - List deals
  - GET  /api/stats        - Dashboard stats
  `);
});

module.exports = app;
