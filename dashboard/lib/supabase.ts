/**
 * ========================================
 * Supabase Client for Dashboard
 * ========================================
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// Helper Functions
// ========================================

/**
 * الحصول على إحصائيات الداشبورد
 */
export async function getDashboardStats() {
    const [properties, customers, marketers, deals] = await Promise.all([
        supabase.from('properties').select('id, status', { count: 'exact' }),
        supabase.from('customers').select('id, status', { count: 'exact' }),
        supabase.from('marketers').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('deals').select('id, status, deal_value, commission_amount')
    ]);

    const completedDeals = deals.data?.filter(d => d.status === 'completed') || [];

    return {
        totalProperties: properties.count || 0,
        availableProperties: properties.data?.filter(p => p.status === 'available').length || 0,
        totalCustomers: customers.count || 0,
        newCustomers: customers.data?.filter(c => c.status === 'new').length || 0,
        activeMarketers: marketers.count || 0,
        totalDeals: deals.data?.length || 0,
        completedDeals: completedDeals.length,
        totalRevenue: completedDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0),
        totalCommission: completedDeals.reduce((sum, d) => sum + (d.commission_amount || 0), 0)
    };
}

/**
 * الحصول على العقارات
 */
export async function getProperties(filters = {}) {
    let query = supabase
        .from('properties')
        .select('*, marketers(full_name, phone)')
        .order('created_at', { ascending: false });

    if (filters.city) query = query.eq('city', filters.city);
    if (filters.type) query = query.eq('property_type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    return { data, error };
}

/**
 * الحصول على المسوقين
 */
export async function getMarketers() {
    const { data, error } = await supabase
        .from('marketers')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

    return { data, error };
}

/**
 * الحصول على العملاء
 */
export async function getCustomers(filters = {}) {
    let query = supabase
        .from('customers')
        .select('*, marketers(full_name)')
        .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.marketer) query = query.eq('assigned_marketer', filters.marketer);

    const { data, error } = await query;
    return { data, error };
}

/**
 * الحصول على الصفقات
 */
export async function getDeals(filters = {}) {
    let query = supabase
        .from('deals')
        .select('*, properties(title, property_code), customers(full_name), marketers(full_name)')
        .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    return { data, error };
}

/**
 * الحصول على المحادثات الأخيرة
 */
export async function getRecentConversations(limit = 50) {
    const { data, error } = await supabase
        .from('conversations')
        .select('*, customers(full_name)')
        .order('created_at', { ascending: false })
        .limit(limit);

    return { data, error };
}

/**
 * تسجيل الاشتراك في التحديثات الفورية
 */
export function subscribeToTable(table, callback) {
    return supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
        .subscribe();
}
