'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Marketer {
    id: string;
    full_name: string;
    city: string;
    active_customers: number;
    total_sales: number;
    total_revenue: number;
    rating: number;
}

export default function RecentActivity() {
    const [marketers, setMarketers] = useState<Marketer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarketers();
    }, []);

    async function loadMarketers() {
        try {
            const { data, error } = await supabase
                .from('marketers')
                .select('*')
                .eq('is_active', true)
                .order('total_revenue', { ascending: false })
                .limit(5);

            if (error) throw error;
            setMarketers(data || []);
        } catch (error) {
            console.error('Error loading marketers:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="card mt-8 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">📈 أداء المسوقين</h2>
                <a href="/marketers" className="text-blue-600 hover:underline text-sm">
                    عرض الكل
                </a>
            </div>

            {marketers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا يوجد مسوقين حالياً</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>المسوق</th>
                                <th>المدينة</th>
                                <th>العملاء النشطين</th>
                                <th>الصفقات</th>
                                <th>الإيرادات</th>
                                <th>التقييم</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marketers.map((marketer, index) => (
                                <tr key={marketer.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {marketer.full_name?.charAt(0) || '?'}
                                            </div>
                                            <span className="font-medium">{marketer.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="text-gray-600">{marketer.city || '-'}</td>
                                    <td>
                                        <span className="badge bg-blue-100 text-blue-800">
                                            {marketer.active_customers || 0} عميل
                                        </span>
                                    </td>
                                    <td className="font-medium">{marketer.total_sales || 0}</td>
                                    <td className="font-bold text-green-600">
                                        {(marketer.total_revenue || 0).toLocaleString()} ريال
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <span className="text-amber-500">⭐</span>
                                            <span className="font-medium">{marketer.rating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
