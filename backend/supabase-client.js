/**
 * ========================================
 * Supabase Client - اتصال قاعدة البيانات
 * ========================================
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// إعدادات Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// التحقق من وجود الإعدادات
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration!');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

// إنشاء عميل Supabase مع صلاحيات الخدمة
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// ========================================
// دوال المساعدة
// ========================================

/**
 * الحصول على رابط الصورة العام
 */
function getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl;
}

/**
 * رفع صورة إلى Storage
 */
async function uploadImage(bucket, path, file, contentType = 'image/jpeg') {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            contentType,
            upsert: true
        });

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    return getPublicUrl(bucket, path);
}

module.exports = {
    supabase,
    getPublicUrl,
    uploadImage
};
