'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { href: '/', icon: '📊', label: 'لوحة التحكم' },
    { href: '/properties', icon: '🏠', label: 'العقارات' },
    { href: '/customers', icon: '👥', label: 'العملاء' },
    { href: '/marketers', icon: '👨‍💼', label: 'المسوقين' },
    { href: '/deals', icon: '💰', label: 'الصفقات' },
    { href: '/conversations', icon: '💬', label: 'المحادثات' },
    { href: '/reports', icon: '📈', label: 'التقارير' },
    { href: '/settings', icon: '⚙️', label: 'الإعدادات' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar w-64 min-h-screen sticky top-0">
            {/* الشعار */}
            <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl">
                        🏠
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">منصة عقاري</h1>
                        <p className="text-gray-400 text-xs">لوحة التحكم</p>
                    </div>
                </div>
            </div>

            {/* القائمة */}
            <nav className="p-4">
                <ul className="space-y-1">
                    {menuItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* حالة الاتصال */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-gray-400">متصل بواتساب</span>
                </div>
            </div>
        </aside>
    );
}
