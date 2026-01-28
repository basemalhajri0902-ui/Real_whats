-- ========================================
-- تحديث جدول العقارات - إضافة أعمدة المواصفات الديناميكية
-- نفذ هذا الكود في Supabase SQL Editor
-- ========================================

-- إضافة أعمدة المساحات
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_area DECIMAL(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_area DECIMAL(10,2);

-- إضافة أعمدة الغرف والمرافق
ALTER TABLE properties ADD COLUMN IF NOT EXISTS kitchens INT DEFAULT 1;

-- إضافة أعمدة تفاصيل البناء
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_number INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS facade VARCHAR(20);

-- إضافة أعمدة تفاصيل العمارة
ALTER TABLE properties ADD COLUMN IF NOT EXISTS units_count INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS shops_count INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS annual_income DECIMAL(12,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupancy_rate INT;

-- إضافة أعمدة تفاصيل الأرض
ALTER TABLE properties ADD COLUMN IF NOT EXISTS street_width DECIMAL(6,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS streets_count INT DEFAULT 1;

-- إضافة أعمدة تفاصيل تجاري
ALTER TABLE properties ADD COLUMN IF NOT EXISTS facade_length DECIMAL(6,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_main_street BOOLEAN DEFAULT FALSE;

-- إضافة أعمدة إضافية
ALTER TABLE properties ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20);

-- تحديث الحالة الافتراضية
ALTER TABLE properties ALTER COLUMN status SET DEFAULT 'pending';

-- ========================================
-- ملخص الأعمدة الجديدة:
-- ========================================
-- land_area: مساحة الأرض (م²)
-- building_area: مساحة البناء (م²)
-- kitchens: عدد المطابخ
-- floor_number: رقم الدور (للشقق)
-- facade: الواجهة (شمالية/جنوبية/شرقية/غربية)
-- units_count: عدد الوحدات/الشقق (للعمارات)
-- shops_count: عدد المحلات (للعمارات)
-- annual_income: الدخل السنوي (ريال)
-- occupancy_rate: نسبة الإشغال/التأجير (%)
-- street_width: عرض الشارع (متر)
-- streets_count: عدد الشوارع
-- facade_length: طول الواجهة (للمحلات)
-- is_main_street: هل على شارع رئيسي
-- external_links: روابط خارجية (يوتيوب، خرائط)
-- owner_phone: هاتف المالك
-- ========================================
