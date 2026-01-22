-- Seed checklist_templates with default compliance templates
-- Run this in the Supabase SQL Editor to populate the templates table

-- First, ensure the table has the required columns
DO $$ 
BEGIN
  -- Add is_public column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'checklist_templates' AND column_name = 'is_public') THEN
    ALTER TABLE checklist_templates ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'checklist_templates' AND column_name = 'metadata') THEN
    ALTER TABLE checklist_templates ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Insert default templates (using ON CONFLICT to handle duplicates)
INSERT INTO checklist_templates (name, description, business_type, category, usage_count, average_rating, rating_count, is_public, template_items, created_at, updated_at)
VALUES 
-- Template 1: Cannabis Cultivator Startup
(
  'Cannabis Cultivator Startup Checklist',
  'Complete checklist for starting a cannabis cultivation facility including licensing, facility setup, and compliance requirements.',
  'cultivator',
  'new_license',
  245,
  4.8,
  52,
  true,
  '[
    {"title": "Submit License Application", "description": "Complete and submit state cannabis cultivation license application", "category": "Licensing", "priority": "high"},
    {"title": "Background Check", "description": "Complete background check for all owners and key employees", "category": "Licensing", "priority": "high"},
    {"title": "Facility Security Plan", "description": "Develop comprehensive security plan with cameras, alarms, and access controls", "category": "Security", "priority": "high"},
    {"title": "Seed-to-Sale System Setup", "description": "Implement state-approved tracking system", "category": "Compliance", "priority": "high"},
    {"title": "Environmental Controls", "description": "Install HVAC, lighting, and irrigation systems", "category": "Facility", "priority": "medium"},
    {"title": "Waste Disposal Plan", "description": "Establish cannabis waste disposal procedures", "category": "Compliance", "priority": "medium"},
    {"title": "Employee Training Program", "description": "Develop training materials for cultivation staff", "category": "Operations", "priority": "medium"},
    {"title": "Quality Control Procedures", "description": "Document QC procedures for cultivation operations", "category": "Quality", "priority": "medium"},
    {"title": "Pesticide Management Plan", "description": "Create IPM plan with approved pesticides list", "category": "Compliance", "priority": "high"},
    {"title": "Water Usage Documentation", "description": "Document water source and usage tracking systems", "category": "Environmental", "priority": "medium"},
    {"title": "Energy Efficiency Assessment", "description": "Complete energy audit and efficiency plan", "category": "Environmental", "priority": "low"},
    {"title": "Local Permit Acquisition", "description": "Obtain all required local permits and zoning approvals", "category": "Licensing", "priority": "high"}
  ]'::jsonb,
  NOW(),
  NOW()
),

-- Template 2: Dispensary Annual Renewal
(
  'Dispensary Annual Renewal',
  'Checklist for annual license renewal including documentation, inspections, and compliance verification.',
  'retailer',
  'annual_renewal',
  189,
  4.6,
  38,
  true,
  '[
    {"title": "Renewal Application", "description": "Submit license renewal application before deadline", "category": "Licensing", "priority": "high"},
    {"title": "Financial Records Review", "description": "Prepare financial statements and tax documentation", "category": "Financial", "priority": "high"},
    {"title": "Compliance Audit", "description": "Conduct internal compliance audit", "category": "Compliance", "priority": "high"},
    {"title": "Employee Certifications", "description": "Verify all employee certifications are current", "category": "Personnel", "priority": "medium"},
    {"title": "Security System Inspection", "description": "Schedule security system inspection and maintenance", "category": "Security", "priority": "medium"},
    {"title": "Inventory Reconciliation", "description": "Complete full inventory reconciliation", "category": "Inventory", "priority": "high"},
    {"title": "Insurance Verification", "description": "Verify insurance policies are current and adequate", "category": "Financial", "priority": "high"},
    {"title": "Fire Safety Inspection", "description": "Schedule and pass fire safety inspection", "category": "Safety", "priority": "high"},
    {"title": "ADA Compliance Check", "description": "Verify facility meets ADA accessibility requirements", "category": "Compliance", "priority": "medium"},
    {"title": "Staff Training Records", "description": "Compile all staff training documentation for review", "category": "Personnel", "priority": "medium"}
  ]'::jsonb,
  NOW(),
  NOW()
),

-- Template 3: Manufacturing Facility Inspection Prep
(
  'Manufacturing Facility Inspection Prep',
  'Prepare for state regulatory inspections with this comprehensive checklist covering all major compliance areas.',
  'manufacturer',
  'inspection_prep',
  156,
  4.9,
  29,
  true,
  '[
    {"title": "Documentation Review", "description": "Ensure all SOPs and records are current and accessible", "category": "Documentation", "priority": "high"},
    {"title": "Equipment Calibration", "description": "Verify all equipment is calibrated and documented", "category": "Equipment", "priority": "high"},
    {"title": "Sanitation Verification", "description": "Complete deep cleaning and sanitation of facility", "category": "Sanitation", "priority": "high"},
    {"title": "Staff Training Records", "description": "Compile all staff training documentation", "category": "Personnel", "priority": "medium"},
    {"title": "Product Testing Records", "description": "Organize all COAs and testing documentation", "category": "Quality", "priority": "high"},
    {"title": "Waste Disposal Logs", "description": "Review and organize waste disposal records", "category": "Compliance", "priority": "medium"},
    {"title": "Security Audit", "description": "Verify security systems and access logs", "category": "Security", "priority": "medium"},
    {"title": "HACCP Plan Review", "description": "Review and update HACCP plan documentation", "category": "Quality", "priority": "high"},
    {"title": "Batch Records Audit", "description": "Audit recent batch records for completeness", "category": "Documentation", "priority": "high"},
    {"title": "Recall Procedure Review", "description": "Verify recall procedures are documented and staff trained", "category": "Quality", "priority": "medium"},
    {"title": "Visitor Log Review", "description": "Ensure visitor logs are complete and accurate", "category": "Security", "priority": "low"}
  ]'::jsonb,
  NOW(),
  NOW()
),

-- Template 4: Testing Lab Accreditation
(
  'Testing Lab Accreditation',
  'Complete checklist for cannabis testing laboratory accreditation and compliance.',
  'testing_lab',
  'new_license',
  87,
  4.7,
  18,
  true,
  '[
    {"title": "ISO 17025 Documentation", "description": "Prepare quality management system documentation", "category": "Accreditation", "priority": "high"},
    {"title": "Method Validation", "description": "Complete validation studies for all test methods", "category": "Technical", "priority": "high"},
    {"title": "Proficiency Testing", "description": "Enroll in and complete proficiency testing programs", "category": "Quality", "priority": "high"},
    {"title": "Equipment Qualification", "description": "Complete IQ/OQ/PQ for all analytical equipment", "category": "Equipment", "priority": "high"},
    {"title": "Staff Competency", "description": "Document analyst training and competency assessments", "category": "Personnel", "priority": "medium"},
    {"title": "LIMS Implementation", "description": "Implement laboratory information management system", "category": "Systems", "priority": "medium"},
    {"title": "Chain of Custody Procedures", "description": "Document sample handling and chain of custody", "category": "Quality", "priority": "high"},
    {"title": "Uncertainty Calculations", "description": "Complete measurement uncertainty calculations for all methods", "category": "Technical", "priority": "high"},
    {"title": "Internal Audit Program", "description": "Establish internal audit schedule and procedures", "category": "Quality", "priority": "medium"},
    {"title": "Management Review", "description": "Conduct management review meeting and document", "category": "Quality", "priority": "medium"}
  ]'::jsonb,
  NOW(),
  NOW()
),

-- Template 5: New Product Launch Compliance
(
  'New Product Launch Compliance',
  'Ensure regulatory compliance when launching new cannabis products including packaging, labeling, and testing requirements.',
  'all',
  'product_launch',
  134,
  4.5,
  24,
  true,
  '[
    {"title": "Product Registration", "description": "Register new product with state regulatory agency", "category": "Regulatory", "priority": "high"},
    {"title": "Lab Testing", "description": "Complete all required potency and safety testing", "category": "Testing", "priority": "high"},
    {"title": "Label Compliance Review", "description": "Verify label meets all state requirements", "category": "Packaging", "priority": "high"},
    {"title": "Child-Resistant Packaging", "description": "Ensure packaging meets child-resistant requirements", "category": "Packaging", "priority": "high"},
    {"title": "Marketing Material Review", "description": "Review all marketing for compliance", "category": "Marketing", "priority": "medium"},
    {"title": "Staff Training", "description": "Train staff on new product specifications", "category": "Training", "priority": "medium"},
    {"title": "Allergen Assessment", "description": "Complete allergen assessment for edible products", "category": "Quality", "priority": "high"},
    {"title": "Serving Size Verification", "description": "Verify serving sizes comply with state limits", "category": "Compliance", "priority": "high"},
    {"title": "QR Code Setup", "description": "Set up QR code linking to COA and product info", "category": "Packaging", "priority": "medium"},
    {"title": "Pricing Strategy", "description": "Finalize pricing and update POS system", "category": "Operations", "priority": "medium"}
  ]'::jsonb,
  NOW(),
  NOW()
),

-- Template 6: Hemp CBD Product Compliance
(
  'Hemp CBD Product Compliance',
  'Compliance checklist for hemp-derived CBD products including federal and state requirements.',
  'manufacturer',
  'product_launch',
  112,
  4.4,
  21,
  true,
  '[
    {"title": "Hemp Source Verification", "description": "Verify hemp source is from licensed grower with COA", "category": "Sourcing", "priority": "high"},
    {"title": "THC Compliance Testing", "description": "Ensure product contains less than 0.3% THC", "category": "Testing", "priority": "high"},
    {"title": "FDA Labeling Compliance", "description": "Review labels for FDA compliance (no health claims)", "category": "Labeling", "priority": "high"},
    {"title": "State Registration", "description": "Register product in each state where sold", "category": "Regulatory", "priority": "high"},
    {"title": "COA Documentation", "description": "Maintain batch-specific certificates of analysis", "category": "Documentation", "priority": "medium"},
    {"title": "GMP Compliance", "description": "Verify manufacturing follows GMP guidelines", "category": "Quality", "priority": "high"},
    {"title": "Heavy Metals Testing", "description": "Complete heavy metals testing for all batches", "category": "Testing", "priority": "high"},
    {"title": "Pesticide Screening", "description": "Screen for pesticides per state requirements", "category": "Testing", "priority": "high"},
    {"title": "Shelf Life Testing", "description": "Complete stability testing for shelf life claims", "category": "Quality", "priority": "medium"}
  ]'::jsonb,
  NOW(),
  NOW()
),

-- Template 7: Delivery Service Compliance
(
  'Delivery Service Compliance',
  'Compliance checklist for cannabis delivery operations including vehicle requirements, driver training, and security protocols.',
  'retailer',
  'new_license',
  98,
  4.6,
  15,
  true,
  '[
    {"title": "Delivery License Application", "description": "Submit delivery endorsement or separate license application", "category": "Licensing", "priority": "high"},
    {"title": "Vehicle Registration", "description": "Register all delivery vehicles with state agency", "category": "Licensing", "priority": "high"},
    {"title": "GPS Tracking Setup", "description": "Install and test GPS tracking in all vehicles", "category": "Security", "priority": "high"},
    {"title": "Driver Background Checks", "description": "Complete background checks for all drivers", "category": "Personnel", "priority": "high"},
    {"title": "Driver Training Program", "description": "Develop and conduct driver training on compliance", "category": "Training", "priority": "high"},
    {"title": "Cash Handling Procedures", "description": "Establish secure cash handling protocols", "category": "Security", "priority": "high"},
    {"title": "Age Verification System", "description": "Implement ID scanning and age verification", "category": "Compliance", "priority": "high"},
    {"title": "Delivery Zone Mapping", "description": "Define and document approved delivery zones", "category": "Operations", "priority": "medium"},
    {"title": "Vehicle Security Features", "description": "Install lockboxes and security features in vehicles", "category": "Security", "priority": "high"},
    {"title": "Insurance Coverage", "description": "Obtain required commercial auto and liability insurance", "category": "Financial", "priority": "high"}
  ]'::jsonb,
  NOW(),
  NOW()
),

-- Template 8: Social Equity Application Support
(
  'Social Equity Application Support',
  'Checklist for social equity cannabis license applicants including documentation and program requirements.',
  'all',
  'new_license',
  76,
  4.8,
  12,
  true,
  '[
    {"title": "Eligibility Verification", "description": "Gather documentation proving social equity eligibility", "category": "Documentation", "priority": "high"},
    {"title": "Residency Documentation", "description": "Compile proof of residency in qualifying area", "category": "Documentation", "priority": "high"},
    {"title": "Income Verification", "description": "Gather income documentation if required", "category": "Documentation", "priority": "medium"},
    {"title": "Business Plan Development", "description": "Create comprehensive business plan", "category": "Planning", "priority": "high"},
    {"title": "Funding Source Documentation", "description": "Document all funding sources and investors", "category": "Financial", "priority": "high"},
    {"title": "Community Benefit Plan", "description": "Develop community reinvestment plan", "category": "Planning", "priority": "medium"},
    {"title": "Technical Assistance", "description": "Apply for available technical assistance programs", "category": "Support", "priority": "medium"},
    {"title": "Mentorship Program", "description": "Connect with industry mentorship programs", "category": "Support", "priority": "low"},
    {"title": "Fee Waiver Application", "description": "Apply for license fee waivers if available", "category": "Financial", "priority": "medium"},
    {"title": "Local Priority Program", "description": "Research and apply for local priority programs", "category": "Licensing", "priority": "medium"}
  ]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  business_type = EXCLUDED.business_type,
  category = EXCLUDED.category,
  template_items = EXCLUDED.template_items,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

-- Create index for faster template queries
CREATE INDEX IF NOT EXISTS idx_checklist_templates_business_type ON checklist_templates(business_type);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_category ON checklist_templates(category);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_usage ON checklist_templates(usage_count DESC);

-- Grant necessary permissions
GRANT SELECT ON checklist_templates TO authenticated;
GRANT SELECT ON checklist_templates TO anon;

-- Verify the seeding
SELECT 
  name,
  business_type,
  category,
  usage_count,
  average_rating,
  jsonb_array_length(template_items) as item_count
FROM checklist_templates
ORDER BY usage_count DESC;
