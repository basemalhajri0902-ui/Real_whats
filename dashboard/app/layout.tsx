import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'لوحة التحكم - منصة عقاري',
    description: 'لوحة تحكم المنظومة العقارية المتكاملة',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body className="bg-gray-50 min-h-screen">
                {children}
            </body>
        </html>
    );
}
