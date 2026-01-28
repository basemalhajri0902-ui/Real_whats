/**
 * ========================================
 * نظام توزيع المسوقين الذكي
 * ========================================
 * يوزع العملاء على المسوقين بناءً على معايير متعددة
 */

const { supabase } = require('./supabase-client');

/**
 * الحصول على أفضل مسوق لعميل معين
 * يأخذ بعين الاعتبار: المدينة، التخصص، عدد العملاء الحاليين، التقييم
 */
async function getBestMarketer(city = null, specialization = null) {
    try {
        // استخدام الدالة المخزنة في قاعدة البيانات
        const { data, error } = await supabase.rpc('get_best_marketer', {
            p_city: city,
            p_specialization: specialization
        });

        if (error) {
            console.error('Get best marketer error:', error);
            // fallback: الحصول على أي مسوق نشط
            return getFallbackMarketer();
        }

        if (data && data.length > 0) {
            return data[0];
        }

        // إذا لم نجد مسوق بنفس المدينة/التخصص، نبحث عن أي مسوق متاح
        return getFallbackMarketer();

    } catch (error) {
        console.error('Get best marketer error:', error);
        return null;
    }
}

/**
 * الحصول على أي مسوق متاح (fallback)
 */
async function getFallbackMarketer() {
    const { data, error } = await supabase
        .from('marketers')
        .select('id, full_name, phone, active_customers, rating')
        .eq('is_active', true)
        .order('active_customers', { ascending: true })
        .order('rating', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        marketer_id: data.id,
        marketer_name: data.full_name,
        marketer_phone: data.phone,
        active_customers: data.active_customers,
        rating: data.rating
    };
}

/**
 * تعيين مسوق لعميل
 */
async function assignMarketerToCustomer(customerId, marketerId) {
    try {
        // تحديث العميل
        const { error: customerError } = await supabase
            .from('customers')
            .update({
                assigned_marketer: marketerId,
                status: 'contacted'
            })
            .eq('id', customerId);

        if (customerError) throw customerError;

        // زيادة عدد العملاء النشطين للمسوق
        const { error: marketerError } = await supabase
            .rpc('increment_marketer_customers', { marketer_id: marketerId });

        if (marketerError) {
            // fallback: تحديث يدوي
            const { data: marketer } = await supabase
                .from('marketers')
                .select('active_customers')
                .eq('id', marketerId)
                .single();

            await supabase
                .from('marketers')
                .update({ active_customers: (marketer?.active_customers || 0) + 1 })
                .eq('id', marketerId);
        }

        return true;

    } catch (error) {
        console.error('Assign marketer error:', error);
        return false;
    }
}

/**
 * إعادة توزيع عملاء مسوق على آخرين
 * (مثلاً عند تعطيل مسوق)
 */
async function redistributeCustomers(fromMarketerId) {
    try {
        // الحصول على عملاء المسوق
        const { data: customers, error } = await supabase
            .from('customers')
            .select('id, city, preferred_property')
            .eq('assigned_marketer', fromMarketerId)
            .in('status', ['new', 'contacted', 'viewing', 'negotiating']);

        if (error) throw error;
        if (!customers || customers.length === 0) return { reassigned: 0 };

        let reassigned = 0;

        for (const customer of customers) {
            // البحث عن مسوق جديد (مع استبعاد المسوق الحالي)
            const { data: newMarketer } = await supabase
                .from('marketers')
                .select('id')
                .eq('is_active', true)
                .neq('id', fromMarketerId)
                .eq('city', customer.city)
                .order('active_customers', { ascending: true })
                .limit(1)
                .single();

            if (newMarketer) {
                await assignMarketerToCustomer(customer.id, newMarketer.id);
                reassigned++;
            }
        }

        // تحديث عدد العملاء للمسوق القديم
        await supabase
            .from('marketers')
            .update({ active_customers: 0 })
            .eq('id', fromMarketerId);

        return { reassigned, total: customers.length };

    } catch (error) {
        console.error('Redistribute customers error:', error);
        return { error: error.message };
    }
}

/**
 * الحصول على إحصائيات توزيع المسوقين
 */
async function getDistributionStats() {
    try {
        const { data: marketers, error } = await supabase
            .from('marketers')
            .select('id, full_name, city, active_customers, rating, total_sales')
            .eq('is_active', true)
            .order('active_customers', { ascending: false });

        if (error) throw error;

        const totalCustomers = marketers.reduce((sum, m) => sum + (m.active_customers || 0), 0);
        const avgCustomers = marketers.length > 0 ? totalCustomers / marketers.length : 0;

        return {
            marketers: marketers,
            stats: {
                total_marketers: marketers.length,
                total_active_customers: totalCustomers,
                avg_customers_per_marketer: avgCustomers.toFixed(1),
                max_customers: Math.max(...marketers.map(m => m.active_customers || 0)),
                min_customers: Math.min(...marketers.map(m => m.active_customers || 0))
            }
        };

    } catch (error) {
        console.error('Get distribution stats error:', error);
        return null;
    }
}

/**
 * موازنة توزيع العملاء بين المسوقين
 */
async function rebalanceDistribution() {
    try {
        const stats = await getDistributionStats();
        if (!stats) return { error: 'Could not get stats' };

        const avgCustomers = parseFloat(stats.stats.avg_customers_per_marketer);
        const threshold = avgCustomers * 1.5; // 50% فوق المتوسط

        // المسوقين المحملين بشكل زائد
        const overloaded = stats.marketers.filter(m => m.active_customers > threshold);

        // المسوقين الذين يمكنهم استقبال المزيد
        const available = stats.marketers.filter(m => m.active_customers < avgCustomers);

        if (overloaded.length === 0 || available.length === 0) {
            return { message: 'Distribution is balanced', rebalanced: 0 };
        }

        // نقل بعض العملاء
        let rebalanced = 0;

        for (const marketer of overloaded) {
            const excess = marketer.active_customers - avgCustomers;

            // الحصول على عملاء للنقل
            const { data: customersToMove } = await supabase
                .from('customers')
                .select('id, city')
                .eq('assigned_marketer', marketer.id)
                .eq('status', 'new')
                .limit(Math.floor(excess));

            if (customersToMove) {
                for (const customer of customersToMove) {
                    // البحث عن مسوق متاح بنفس المدينة
                    const target = available.find(m => m.city === customer.city && m.active_customers < avgCustomers);

                    if (target) {
                        await assignMarketerToCustomer(customer.id, target.id);
                        target.active_customers++;
                        marketer.active_customers--;
                        rebalanced++;
                    }
                }
            }
        }

        return { message: `Rebalanced ${rebalanced} customers`, rebalanced };

    } catch (error) {
        console.error('Rebalance error:', error);
        return { error: error.message };
    }
}

module.exports = {
    getBestMarketer,
    assignMarketerToCustomer,
    redistributeCustomers,
    getDistributionStats,
    rebalanceDistribution
};
