'use client';

import { useEffect, useState } from 'react';
import { supabase, getDashboardStats } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import StatsCards from '../components/StatsCards';
import RecentActivity from '../components/RecentActivity';

interface DashboardStats {
    totalProperties: number;
    availableProperties: number;
    totalCustomers: number;
    newCustomers: number;
    activeMarketers: number;
    totalDeals: number;
    completedDeals: number;
    totalRevenue: number;
    totalCommission: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentProperties, setRecentProperties] = useState([]);
    const [recentCustomers, setRecentCustomers] = useState([]);

    useEffect(() => {
        loadDashboardData();

        // اشتراك في التحديثات الفورية
        const subscription = supabase
            .channel('dashboard_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
                loadDashboardData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
                loadDashboardData();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function loadDashboardData() {
        try {
            const dashboardStats = await getDashboardStats();
            setStats(dashboardStats);

            // أحدث العقارات
            const { data: properties } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentProperties(properties || []);

            // أحدث العملاء
            const { data: customers } = await supabase
                .from('customers')
                .select('*, marketers(full_name)')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentCustomers(customers || []);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-48"></div>
                        <div className="grid grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex">
            <Sidebar />

            <main className="flex-1 p-8">
                {/* العنوان */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
                    <p className="text-gray-500 mt-1">مرحباً بك في منصة عقاري</p>
                </div>

                {/* البطاقات الإحصائية */}
                {stats && <StatsCards stats={stats} />}

                {/* المحتوى الرئيسي */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    {/* أحدث العقارات */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">🏠 أحدث العقارات</h2>
                            <a href="/properties" className="text-blue-600 hover:underline text-sm">
                                عرض الكل
                            </a>
                        </div>

                        {recentProperties.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">لا توجد عقارات حالياً</p>
                        ) : (
                            <div className="space-y-4">
                                {recentProperties.map((property: any) => (
                                    <div key={property.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl">
                                            🏠
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800">{property.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {property.city} • {property.property_type}
                                            </p>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-green-600">
                                                {property.price?.toLocaleString()} ريال
                                            </p>
                                            <span className={`badge badge-${property.status}`}>
                                                {property.status === 'available' ? 'متاح' :
                                                    property.status === 'sold' ? 'مباع' : 'مؤجر'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* أحدث العملاء */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">👥 أحدث العملاء</h2>
                            <a href="/customers" className="text-blue-600 hover:underline text-sm">
                                عرض الكل
                            </a>
                        </div>

                        {recentCustomers.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">لا يوجد عملاء حالياً</p>
                        ) : (
                            <div className="space-y-4">
                                {recentCustomers.map((customer: any) => (
                                    <div key={customer.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl">
                                            👤
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800">
                                                {customer.full_name || customer.phone}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {customer.city || 'غير محدد'} • {customer.preferred_property || 'غير محدد'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`badge badge-${customer.status}`}>
                                                {customer.status === 'new' ? 'جديد' :
                                                    customer.status === 'contacted' ? 'تم التواصل' :
                                                        customer.status === 'viewing' ? 'معاينة' :
                                                            customer.status === 'negotiating' ? 'تفاوض' : customer.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* أداء المسوقين */}
                <RecentActivity />
            </main>
        </div>
    );
}
