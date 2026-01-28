'use client';

interface StatsCardsProps {
    stats: {
        totalProperties: number;
        availableProperties: number;
        totalCustomers: number;
        newCustomers: number;
        activeMarketers: number;
        completedDeals: number;
        totalRevenue: number;
        totalCommission: number;
    };
}

export default function StatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            title: 'العقارات',
            value: stats.totalProperties,
            subtitle: `${stats.availableProperties} متاح`,
            icon: '🏠',
            gradient: 'from-blue-500 to-blue-600',
            bgLight: 'bg-blue-50'
        },
        {
            title: 'العملاء',
            value: stats.totalCustomers,
            subtitle: `${stats.newCustomers} جديد`,
            icon: '👥',
            gradient: 'from-green-500 to-green-600',
            bgLight: 'bg-green-50'
        },
        {
            title: 'المسوقين',
            value: stats.activeMarketers,
            subtitle: 'نشط',
            icon: '👨‍💼',
            gradient: 'from-purple-500 to-purple-600',
            bgLight: 'bg-purple-50'
        },
        {
            title: 'الصفقات',
            value: stats.completedDeals,
            subtitle: 'مكتملة',
            icon: '💰',
            gradient: 'from-amber-500 to-amber-600',
            bgLight: 'bg-amber-50'
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`stat-card card ${card.bgLight} border-0`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-600 text-sm mb-1">{card.title}</p>
                            <h3 className="text-3xl font-bold text-gray-800">
                                {card.value.toLocaleString()}
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">{card.subtitle}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white text-2xl shadow-lg`}>
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}

            {/* بطاقة الإيرادات */}
            <div className="col-span-1 md:col-span-2 stat-card card bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 text-sm mb-1">إجمالي الإيرادات</p>
                        <h3 className="text-3xl font-bold">
                            {stats.totalRevenue.toLocaleString()} <span className="text-lg">ريال</span>
                        </h3>
                        <p className="text-indigo-100 text-sm mt-2">
                            العمولات: {stats.totalCommission.toLocaleString()} ريال
                        </p>
                    </div>
                    <div className="text-6xl opacity-50">
                        💵
                    </div>
                </div>
            </div>
        </div>
    );
}
