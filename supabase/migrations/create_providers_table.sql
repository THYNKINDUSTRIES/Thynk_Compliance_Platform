-- Create the providers table for compliance service providers
-- Run this in your Supabase SQL Editor

-- Drop existing table if needed (uncomment if you want to reset)
-- DROP TABLE IF EXISTS providers;

CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  tier TEXT CHECK (tier IN ('VIP', 'Vetted', 'Standard')) DEFAULT 'Standard',
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  services TEXT[],
  states_covered TEXT[],
  pricing_tier TEXT CHECK (pricing_tier IN ('Budget', 'Mid-Range', 'Premium', 'Enterprise')),
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow public read access (anyone can view providers)
CREATE POLICY "Allow public read access" 
  ON providers 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert (for admin purposes)
CREATE POLICY "Allow authenticated insert" 
  ON providers 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update" 
  ON providers 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" 
  ON providers 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_providers_tier ON providers(tier);
CREATE INDEX IF NOT EXISTS idx_providers_categories ON providers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_providers_states ON providers USING GIN(states_covered);
CREATE INDEX IF NOT EXISTS idx_providers_featured ON providers(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_providers_verified ON providers(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_providers_rating ON providers(rating DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_providers_updated_at();

-- Seed with compliance service providers
INSERT INTO providers (name, logo_url, description, categories, tier, website_url, contact_email, contact_phone, services, states_covered, pricing_tier, rating, review_count, verified, featured)
VALUES
  (
    'ComplianceForge',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
    'Industry-leading compliance automation platform with AI-powered regulatory tracking and reporting. Specializing in multi-state cannabis compliance.',
    ARRAY['Compliance Software', 'Regulatory Tracking', 'Reporting'],
    'VIP',
    'https://complianceforge.example.com',
    'info@complianceforge.example.com',
    '1-800-COMPLY-1',
    ARRAY['Compliance Automation', 'Regulatory Alerts', 'Document Management', 'Audit Preparation'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'NY'],
    'Enterprise',
    4.9,
    287,
    true,
    true
  ),
  (
    'GreenTrack Solutions',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=200&fit=crop',
    'Comprehensive seed-to-sale tracking and compliance management. Trusted by over 500 licensed operators nationwide.',
    ARRAY['Seed-to-Sale', 'Inventory Management', 'Compliance'],
    'VIP',
    'https://greentrack.example.com',
    'sales@greentrack.example.com',
    '1-888-GREEN-TK',
    ARRAY['Seed-to-Sale Tracking', 'METRC Integration', 'Inventory Management', 'Compliance Reporting'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'MI', 'IL', 'MA', 'FL', 'AZ', 'NJ', 'NY'],
    'Premium',
    4.8,
    412,
    true,
    true
  ),
  (
    'CannaSafe Labs',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=200&h=200&fit=crop',
    'ISO-certified testing laboratory providing comprehensive cannabis testing services. State-licensed in 15+ markets.',
    ARRAY['Testing', 'Laboratory Services', 'Quality Assurance'],
    'VIP',
    'https://cannasafelabs.example.com',
    'testing@cannasafelabs.example.com',
    '1-877-CANNA-LAB',
    ARRAY['Potency Testing', 'Contaminant Screening', 'Terpene Profiling', 'Certificate of Analysis'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'FL', 'NY', 'NJ', 'PA', 'OH', 'MD'],
    'Premium',
    4.9,
    523,
    true,
    true
  ),
  (
    'Cannabis Law Partners',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop',
    'Full-service cannabis law firm with expertise in licensing, compliance, and regulatory matters across all legal markets.',
    ARRAY['Legal Services', 'Licensing', 'Regulatory'],
    'VIP',
    'https://cannabislawpartners.example.com',
    'consult@cannabislawpartners.example.com',
    '1-855-CANN-LAW',
    ARRAY['License Applications', 'Regulatory Compliance', 'Corporate Structuring', 'Litigation Support'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'FL', 'NY', 'NJ'],
    'Enterprise',
    4.7,
    189,
    true,
    true
  ),
  (
    'SecureGrow Security',
    'https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop',
    'Cannabis-specific security solutions including surveillance, access control, and armed transport services.',
    ARRAY['Security', 'Transportation', 'Surveillance'],
    'Vetted',
    'https://securegrow.example.com',
    'security@securegrow.example.com',
    '1-866-SECURE-G',
    ARRAY['24/7 Surveillance', 'Access Control Systems', 'Armed Transport', 'Security Consulting'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI'],
    'Premium',
    4.6,
    156,
    true,
    false
  ),
  (
    'CannaInsure Pro',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=200&fit=crop',
    'Specialized cannabis insurance broker offering comprehensive coverage for cultivators, manufacturers, and retailers.',
    ARRAY['Insurance', 'Risk Management', 'Financial Services'],
    'Vetted',
    'https://cannainsure.example.com',
    'quotes@cannainsure.example.com',
    '1-844-CANNA-INS',
    ARRAY['Property Insurance', 'Product Liability', 'Crop Insurance', 'Workers Compensation'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'FL'],
    'Mid-Range',
    4.5,
    234,
    true,
    false
  ),
  (
    'GreenBooks Accounting',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop',
    'Cannabis-focused CPA firm specializing in 280E tax planning, financial reporting, and audit preparation.',
    ARRAY['Accounting', 'Tax Services', 'Financial Planning'],
    'Vetted',
    'https://greenbooks.example.com',
    'accounting@greenbooks.example.com',
    '1-833-GREEN-CPA',
    ARRAY['280E Tax Planning', 'Bookkeeping', 'Financial Statements', 'Audit Support'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'FL', 'NY', 'NJ'],
    'Mid-Range',
    4.7,
    178,
    true,
    false
  ),
  (
    'CultivaTech Systems',
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=200&h=200&fit=crop',
    'Advanced cultivation technology including environmental controls, automation, and yield optimization systems.',
    ARRAY['Cultivation Technology', 'Automation', 'Environmental Controls'],
    'Vetted',
    'https://cultivatech.example.com',
    'info@cultivatech.example.com',
    '1-877-CULTIVA',
    ARRAY['Climate Control', 'Irrigation Systems', 'Lighting Solutions', 'Harvest Automation'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'MI', 'OK', 'ME'],
    'Premium',
    4.4,
    145,
    true,
    false
  ),
  (
    'PackRight Cannabis',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop',
    'Compliant packaging solutions for cannabis products. Child-resistant, sustainable, and customizable options.',
    ARRAY['Packaging', 'Labeling', 'Compliance'],
    'Vetted',
    'https://packright.example.com',
    'orders@packright.example.com',
    '1-888-PACK-CAN',
    ARRAY['Child-Resistant Packaging', 'Custom Labels', 'Sustainable Options', 'Compliance Consulting'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'FL', 'NY', 'NJ', 'PA'],
    'Budget',
    4.3,
    312,
    true,
    false
  ),
  (
    'HempHR Solutions',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200&h=200&fit=crop',
    'HR and staffing solutions designed for the cannabis industry. Background checks, training, and compliance.',
    ARRAY['HR Services', 'Staffing', 'Training'],
    'Standard',
    'https://hemphr.example.com',
    'hr@hemphr.example.com',
    '1-855-HEMP-HR1',
    ARRAY['Staffing Solutions', 'Background Checks', 'Compliance Training', 'Payroll Services'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL'],
    'Mid-Range',
    4.2,
    98,
    true,
    false
  ),
  (
    'CannaConstruct Builders',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop',
    'Design-build firm specializing in cannabis facility construction, from cultivation to retail buildouts.',
    ARRAY['Construction', 'Facility Design', 'Build-Out'],
    'Standard',
    'https://cannaconstruct.example.com',
    'projects@cannaconstruct.example.com',
    '1-866-BUILD-CC',
    ARRAY['Facility Design', 'Construction Management', 'Tenant Improvements', 'Permit Assistance'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ'],
    'Premium',
    4.5,
    67,
    true,
    false
  ),
  (
    'LeafyPOS Systems',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop',
    'Cannabis-specific point-of-sale and retail management platform with built-in compliance features.',
    ARRAY['POS Systems', 'Retail Technology', 'Compliance'],
    'Vetted',
    'https://leafypos.example.com',
    'sales@leafypos.example.com',
    '1-877-LEAFY-POS',
    ARRAY['Point of Sale', 'Inventory Management', 'Customer Loyalty', 'Compliance Reporting'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'FL', 'NY'],
    'Mid-Range',
    4.6,
    289,
    true,
    true
  ),
  (
    'TerraWaste Solutions',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=200&h=200&fit=crop',
    'Licensed cannabis waste disposal and destruction services. Compliant, documented, and environmentally responsible.',
    ARRAY['Waste Management', 'Disposal', 'Environmental'],
    'Standard',
    'https://terrawaste.example.com',
    'service@terrawaste.example.com',
    '1-844-TERRA-WS',
    ARRAY['Waste Pickup', 'Destruction Services', 'Documentation', 'Recycling Programs'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV'],
    'Budget',
    4.1,
    76,
    true,
    false
  ),
  (
    'CannaBank Financial',
    'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=200&h=200&fit=crop',
    'Cannabis-friendly banking and financial services. Checking, savings, and merchant processing solutions.',
    ARRAY['Banking', 'Financial Services', 'Merchant Processing'],
    'VIP',
    'https://cannabank.example.com',
    'accounts@cannabank.example.com',
    '1-800-CANNA-BK',
    ARRAY['Business Checking', 'Merchant Services', 'Cash Management', 'Lending Solutions'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'FL', 'NY', 'NJ'],
    'Enterprise',
    4.8,
    198,
    true,
    true
  ),
  (
    'BudBrand Marketing',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=200&fit=crop',
    'Full-service cannabis marketing agency specializing in compliant advertising, branding, and digital marketing.',
    ARRAY['Marketing', 'Branding', 'Digital Advertising'],
    'Vetted',
    'https://budbrand.example.com',
    'hello@budbrand.example.com',
    '1-833-BUD-BRAND',
    ARRAY['Brand Development', 'Digital Marketing', 'Compliant Advertising', 'Social Media'],
    ARRAY['CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MI', 'IL', 'MA', 'FL', 'NY'],
    'Mid-Range',
    4.4,
    134,
    true,
    false
  )
ON CONFLICT (name) DO UPDATE SET
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  categories = EXCLUDED.categories,
  tier = EXCLUDED.tier,
  website_url = EXCLUDED.website_url,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  services = EXCLUDED.services,
  states_covered = EXCLUDED.states_covered,
  pricing_tier = EXCLUDED.pricing_tier,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  verified = EXCLUDED.verified,
  featured = EXCLUDED.featured,
  updated_at = NOW();

-- Verify the data was inserted
SELECT 
  tier,
  COUNT(*) as count,
  ROUND(AVG(rating)::numeric, 2) as avg_rating
FROM providers
GROUP BY tier
ORDER BY 
  CASE tier 
    WHEN 'VIP' THEN 1 
    WHEN 'Vetted' THEN 2 
    WHEN 'Standard' THEN 3 
  END;
