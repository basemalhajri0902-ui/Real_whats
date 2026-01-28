-- ========================================
-- منظومة عقارية متكاملة - Supabase Schema
-- Real Estate System Database Schema
-- ========================================

-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1️⃣ جدول شركات التطوير (developers)
-- ========================================
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  license_number VARCHAR(50),
  city VARCHAR(50),
  logo_url TEXT,
  total_properties INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2️⃣ جدول المسوقين (marketers)
-- ========================================
CREATE TABLE marketers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  city VARCHAR(50),
  specialization VARCHAR(50), -- فلل، شقق، أراضي
  profile_image TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 2.5, -- نسبة العمولة
  total_sales INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  active_customers INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0, -- تقييم من 5
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3️⃣ جدول العقارات (properties)
-- ========================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_code VARCHAR(20) UNIQUE NOT NULL, -- مثل: RYD-2024-001
  title VARCHAR(200) NOT NULL,
  description TEXT,
  property_type VARCHAR(50) NOT NULL, -- فيلا، شقة، أرض، دوبلكس
  transaction_type VARCHAR(20) DEFAULT 'sale', -- sale, rent
  location VARCHAR(200),
  city VARCHAR(50) NOT NULL,
  district VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  price DECIMAL(12,2) NOT NULL,
  price_per_meter DECIMAL(10,2),
  -- المساحات
  area DECIMAL(10,2), -- المساحة الرئيسية بالمتر المربع
  land_area DECIMAL(10,2), -- مساحة الأرض
  building_area DECIMAL(10,2), -- مساحة البناء
  -- الغرف والمرافق
  bedrooms INT,
  bathrooms INT,
  living_rooms INT,
  kitchens INT DEFAULT 1,
  -- تفاصيل البناء
  floors INT DEFAULT 1,
  floor_number INT, -- رقم الدور للشقق
  building_age INT, -- عمر البناء بالسنوات
  facade VARCHAR(20), -- الواجهة: شمالية، جنوبية، شرقية، غربية
  -- تفاصيل العمارة
  units_count INT, -- عدد الشقق
  shops_count INT, -- عدد المحلات
  annual_income DECIMAL(12,2), -- الدخل السنوي
  occupancy_rate INT, -- نسبة التأجير %
  -- تفاصيل الأرض
  street_width DECIMAL(6,2), -- عرض الشارع
  streets_count INT DEFAULT 1, -- عدد الشوارع
  -- تفاصيل تجاري
  facade_length DECIMAL(6,2), -- طول الواجهة
  is_main_street BOOLEAN DEFAULT FALSE, -- على شارع رئيسي
  -- المميزات والوسائط
  features JSONB DEFAULT '[]', -- مميزات: مسبح، حديقة، مصعد، إلخ
  images JSONB DEFAULT '[]', -- مصفوفة روابط الصور
  videos JSONB DEFAULT '[]', -- مصفوفة روابط الفيديو
  external_links JSONB DEFAULT '[]', -- روابط خارجية (يوتيوب، خرائط)
  -- الحالة والإحصائيات
  status VARCHAR(20) DEFAULT 'pending', -- pending, available, sold, rented, reserved
  views_count INT DEFAULT 0,
  favorites_count INT DEFAULT 0,
  -- العلاقات
  developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  marketer_id UUID REFERENCES marketers(id) ON DELETE SET NULL,
  owner_phone VARCHAR(20), -- هاتف المالك
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4️⃣ جدول العملاء (customers)
-- ========================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(100),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  city VARCHAR(50),
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  preferred_type VARCHAR(50), -- شراء، إيجار
  preferred_property VARCHAR(50), -- فيلا، شقة
  preferred_cities JSONB DEFAULT '[]', -- المدن المفضلة
  source VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, website, referral
  assigned_marketer UUID REFERENCES marketers(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'new', -- new, contacted, viewing, negotiating, closed, lost
  notes TEXT,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5️⃣ جدول المحادثات (conversations)
-- ========================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_phone VARCHAR(20) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  message_type VARCHAR(20) NOT NULL, -- incoming, outgoing
  message_text TEXT,
  media_url TEXT, -- إذا أرسل العميل صورة أو ملف
  media_type VARCHAR(20), -- image, video, document, audio
  bot_response TEXT,
  intent VARCHAR(50), -- buy, sell, rent, info, support
  session_state JSONB DEFAULT '{}', -- حالة المحادثة الحالية
  is_handled BOOLEAN DEFAULT FALSE,
  handled_by UUID REFERENCES marketers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6️⃣ جدول الصفقات (deals)
-- ========================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_code VARCHAR(20) UNIQUE NOT NULL, -- مثل: DEAL-2024-001
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  marketer_id UUID REFERENCES marketers(id) ON DELETE SET NULL,
  developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  deal_type VARCHAR(20) NOT NULL, -- sale, rent
  deal_value DECIMAL(12,2) NOT NULL,
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, negotiating, contract, completed, cancelled
  notes TEXT,
  contract_date DATE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 7️⃣ جدول زيارات المعاينة (viewings)
-- ========================================
CREATE TABLE viewings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  marketer_id UUID REFERENCES marketers(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  customer_feedback TEXT,
  marketer_notes TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 8️⃣ جدول المستخدمين الإداريين (admin_users)
-- ========================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin', -- super_admin, admin, viewer
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 9️⃣ جدول إعدادات النظام (settings)
-- ========================================
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 🔟 جدول سجل النشاط (activity_logs)
-- ========================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL, -- property, customer, deal, marketer
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- created, updated, deleted, viewed
  actor_type VARCHAR(20), -- admin, marketer, system, bot
  actor_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES للأداء
-- ========================================

-- Properties indexes
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_marketer ON properties(marketer_id);
CREATE INDEX idx_properties_code ON properties(property_code);

-- Customers indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_marketer ON customers(assigned_marketer);

-- Conversations indexes
CREATE INDEX idx_conversations_phone ON conversations(customer_phone);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

-- Deals indexes
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_marketer ON deals(marketer_id);
CREATE INDEX idx_deals_created ON deals(created_at DESC);

-- Marketers indexes
CREATE INDEX idx_marketers_phone ON marketers(phone);
CREATE INDEX idx_marketers_city ON marketers(city);
CREATE INDEX idx_marketers_active ON marketers(is_active);

-- Activity logs indexes
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- ========================================
-- FUNCTIONS للتحديث التلقائي
-- ========================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers للتحديث التلقائي
CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketers_updated_at BEFORE UPDATE ON marketers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viewings_updated_at BEFORE UPDATE ON viewings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCTION: توليد كود العقار
-- ========================================
CREATE OR REPLACE FUNCTION generate_property_code(p_city VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    city_code VARCHAR(3);
    year_code VARCHAR(4);
    sequence_num INT;
    new_code VARCHAR(20);
BEGIN
    -- تحويل المدينة لكود
    city_code := CASE 
        WHEN p_city ILIKE '%رياض%' OR p_city ILIKE '%riyadh%' THEN 'RYD'
        WHEN p_city ILIKE '%جدة%' OR p_city ILIKE '%jeddah%' THEN 'JED'
        WHEN p_city ILIKE '%مكة%' OR p_city ILIKE '%mecca%' THEN 'MKH'
        WHEN p_city ILIKE '%دمام%' OR p_city ILIKE '%dammam%' THEN 'DMM'
        WHEN p_city ILIKE '%خبر%' OR p_city ILIKE '%khobar%' THEN 'KHB'
        ELSE UPPER(LEFT(p_city, 3))
    END;
    
    year_code := TO_CHAR(NOW(), 'YYYY');
    
    -- الحصول على آخر رقم تسلسلي
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(property_code, '-', 3) AS INT)
    ), 0) + 1
    INTO sequence_num
    FROM properties
    WHERE property_code LIKE city_code || '-' || year_code || '-%';
    
    new_code := city_code || '-' || year_code || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCTION: توزيع العملاء على المسوقين
-- ========================================
CREATE OR REPLACE FUNCTION get_best_marketer(
    p_city VARCHAR DEFAULT NULL,
    p_specialization VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    marketer_id UUID,
    marketer_name VARCHAR,
    marketer_phone VARCHAR,
    active_customers INT,
    rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.full_name,
        m.phone,
        m.active_customers,
        m.rating
    FROM marketers m
    WHERE m.is_active = TRUE
        AND (p_city IS NULL OR m.city = p_city)
        AND (p_specialization IS NULL OR m.specialization = p_specialization)
    ORDER BY 
        m.active_customers ASC, -- الأقل عملاء أولاً
        m.rating DESC           -- الأعلى تقييم
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- RLS (Row Level Security) Policies
-- ========================================

-- تفعيل RLS على الجداول
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketers ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة للعقارات المتاحة
CREATE POLICY "Public can view available properties"
    ON properties FOR SELECT
    USING (status = 'available');

-- سياسات المسوقين لرؤية عقاراتهم
CREATE POLICY "Marketers can view own properties"
    ON properties FOR SELECT
    TO authenticated
    USING (marketer_id = auth.uid());

-- سياسات القراءة للمسوقين (للإدارة)
CREATE POLICY "Authenticated users can view marketers"
    ON marketers FOR SELECT
    TO authenticated
    USING (true);
