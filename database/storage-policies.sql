-- ========================================
-- سياسات تخزين الصور - Storage Policies
-- ========================================

-- ========================================
-- 1️⃣ إنشاء Buckets
-- ========================================
-- ملاحظة: يجب تنفيذ هذا من لوحة تحكم Supabase أو عبر API

-- يمكنك إنشاء الـ buckets من Dashboard:
-- Storage → Create new bucket

-- الـ Buckets المطلوبة:
-- 1. properties (public) - صور العقارات
-- 2. developers (public) - شعارات الشركات
-- 3. marketers (public) - صور المسوقين
-- 4. documents (private) - المستندات والعقود

-- ========================================
-- 2️⃣ سياسات bucket: properties
-- ========================================

-- السماح للجميع بمشاهدة صور العقارات
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties');

-- السماح للمستخدمين المسجلين برفع صور
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'properties');

-- السماح للمالك بحذف صوره
CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'properties' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================
-- 3️⃣ سياسات bucket: developers
-- ========================================

-- السماح للجميع بمشاهدة شعارات الشركات
CREATE POLICY "Public can view developer logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'developers');

-- السماح للمستخدمين المسجلين برفع الشعارات
CREATE POLICY "Authenticated users can upload developer logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'developers');

-- ========================================
-- 4️⃣ سياسات bucket: marketers
-- ========================================

-- السماح للجميع بمشاهدة صور المسوقين
CREATE POLICY "Public can view marketer profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketers');

-- السماح للمستخدمين المسجلين برفع صورهم
CREATE POLICY "Authenticated users can upload marketer images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketers');

-- ========================================
-- 5️⃣ سياسات bucket: documents (خاص)
-- ========================================

-- فقط المستخدمين المسجلين يمكنهم رؤية المستندات
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- فقط المستخدمين المسجلين يمكنهم رفع المستندات
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- ========================================
-- Helper Functions للتخزين
-- ========================================

-- دالة للحصول على رابط الصورة العام
-- استخدمها من الكود:
-- SELECT get_public_url('properties', 'RYD-2026-001/main.jpg');

CREATE OR REPLACE FUNCTION get_public_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
DECLARE
    supabase_url TEXT;
BEGIN
    -- استبدل هذا برابط مشروعك على Supabase
    supabase_url := current_setting('app.settings.supabase_url', true);
    
    IF supabase_url IS NULL THEN
        supabase_url := 'https://YOUR_PROJECT_ID.supabase.co';
    END IF;
    
    RETURN supabase_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- إعدادات حجم الملفات (من Dashboard)
-- ========================================
-- Properties bucket:
--   Max file size: 5MB
--   Allowed types: image/jpeg, image/png, image/webp
--
-- Developers bucket:
--   Max file size: 2MB
--   Allowed types: image/jpeg, image/png, image/svg+xml
--
-- Marketers bucket:
--   Max file size: 2MB
--   Allowed types: image/jpeg, image/png, image/webp
--
-- Documents bucket:
--   Max file size: 10MB
--   Allowed types: application/pdf, image/jpeg, image/png
