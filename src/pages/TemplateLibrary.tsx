import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import TemplateCard from '@/components/TemplateCard';
import TemplatePreviewModal from '@/components/TemplatePreviewModal';
import { Search, Filter, FileText, Database, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Default templates when database is empty or unavailable
const defaultTemplates = [
  {
    id: 'default-1',
    name: 'Cannabis Cultivator Startup Checklist',
    description: 'Complete checklist for starting a cannabis cultivation facility including licensing, facility setup, and compliance requirements.',
    business_type: 'cultivator',
    category: 'new_license',
    usage_count: 245,
    average_rating: 4.8,
    rating_count: 52,
    template_items: [
      { title: 'Submit License Application', description: 'Complete and submit state cannabis cultivation license application', category: 'Licensing', priority: 'high' },
      { title: 'Background Check', description: 'Complete background check for all owners and key employees', category: 'Licensing', priority: 'high' },
      { title: 'Facility Security Plan', description: 'Develop comprehensive security plan with cameras, alarms, and access controls', category: 'Security', priority: 'high' },
      { title: 'Seed-to-Sale System Setup', description: 'Implement state-approved tracking system', category: 'Compliance', priority: 'high' },
      { title: 'Environmental Controls', description: 'Install HVAC, lighting, and irrigation systems', category: 'Facility', priority: 'medium' },
      { title: 'Waste Disposal Plan', description: 'Establish cannabis waste disposal procedures', category: 'Compliance', priority: 'medium' },
      { title: 'Employee Training Program', description: 'Develop training materials for cultivation staff', category: 'Operations', priority: 'medium' },
      { title: 'Quality Control Procedures', description: 'Document QC procedures for cultivation operations', category: 'Quality', priority: 'medium' },
      { title: 'Pesticide Management Plan', description: 'Create IPM plan with approved pesticides list', category: 'Compliance', priority: 'high' },
      { title: 'Water Usage Documentation', description: 'Document water source and usage tracking systems', category: 'Environmental', priority: 'medium' },
      { title: 'Energy Efficiency Assessment', description: 'Complete energy audit and efficiency plan', category: 'Environmental', priority: 'low' },
      { title: 'Local Permit Acquisition', description: 'Obtain all required local permits and zoning approvals', category: 'Licensing', priority: 'high' }
    ]
  },
  {
    id: 'default-2',
    name: 'Dispensary Annual Renewal',
    description: 'Checklist for annual license renewal including documentation, inspections, and compliance verification.',
    business_type: 'retailer',
    category: 'annual_renewal',
    usage_count: 189,
    average_rating: 4.6,
    rating_count: 38,
    template_items: [
      { title: 'Renewal Application', description: 'Submit license renewal application before deadline', category: 'Licensing', priority: 'high' },
      { title: 'Financial Records Review', description: 'Prepare financial statements and tax documentation', category: 'Financial', priority: 'high' },
      { title: 'Compliance Audit', description: 'Conduct internal compliance audit', category: 'Compliance', priority: 'high' },
      { title: 'Employee Certifications', description: 'Verify all employee certifications are current', category: 'Personnel', priority: 'medium' },
      { title: 'Security System Inspection', description: 'Schedule security system inspection and maintenance', category: 'Security', priority: 'medium' },
      { title: 'Inventory Reconciliation', description: 'Complete full inventory reconciliation', category: 'Inventory', priority: 'high' },
      { title: 'Insurance Verification', description: 'Verify insurance policies are current and adequate', category: 'Financial', priority: 'high' },
      { title: 'Fire Safety Inspection', description: 'Schedule and pass fire safety inspection', category: 'Safety', priority: 'high' },
      { title: 'ADA Compliance Check', description: 'Verify facility meets ADA accessibility requirements', category: 'Compliance', priority: 'medium' },
      { title: 'Staff Training Records', description: 'Compile all staff training documentation for review', category: 'Personnel', priority: 'medium' }
    ]
  },
  {
    id: 'default-3',
    name: 'Manufacturing Facility Inspection Prep',
    description: 'Prepare for state regulatory inspections with this comprehensive checklist covering all major compliance areas.',
    business_type: 'manufacturer',
    category: 'inspection_prep',
    usage_count: 156,
    average_rating: 4.9,
    rating_count: 29,
    template_items: [
      { title: 'Documentation Review', description: 'Ensure all SOPs and records are current and accessible', category: 'Documentation', priority: 'high' },
      { title: 'Equipment Calibration', description: 'Verify all equipment is calibrated and documented', category: 'Equipment', priority: 'high' },
      { title: 'Sanitation Verification', description: 'Complete deep cleaning and sanitation of facility', category: 'Sanitation', priority: 'high' },
      { title: 'Staff Training Records', description: 'Compile all staff training documentation', category: 'Personnel', priority: 'medium' },
      { title: 'Product Testing Records', description: 'Organize all COAs and testing documentation', category: 'Quality', priority: 'high' },
      { title: 'Waste Disposal Logs', description: 'Review and organize waste disposal records', category: 'Compliance', priority: 'medium' },
      { title: 'Security Audit', description: 'Verify security systems and access logs', category: 'Security', priority: 'medium' },
      { title: 'HACCP Plan Review', description: 'Review and update HACCP plan documentation', category: 'Quality', priority: 'high' },
      { title: 'Batch Records Audit', description: 'Audit recent batch records for completeness', category: 'Documentation', priority: 'high' },
      { title: 'Recall Procedure Review', description: 'Verify recall procedures are documented and staff trained', category: 'Quality', priority: 'medium' }
    ]
  },
  {
    id: 'default-4',
    name: 'Testing Lab Accreditation',
    description: 'Complete checklist for cannabis testing laboratory accreditation and compliance.',
    business_type: 'testing_lab',
    category: 'new_license',
    usage_count: 87,
    average_rating: 4.7,
    rating_count: 18,
    template_items: [
      { title: 'ISO 17025 Documentation', description: 'Prepare quality management system documentation', category: 'Accreditation', priority: 'high' },
      { title: 'Method Validation', description: 'Complete validation studies for all test methods', category: 'Technical', priority: 'high' },
      { title: 'Proficiency Testing', description: 'Enroll in and complete proficiency testing programs', category: 'Quality', priority: 'high' },
      { title: 'Equipment Qualification', description: 'Complete IQ/OQ/PQ for all analytical equipment', category: 'Equipment', priority: 'high' },
      { title: 'Staff Competency', description: 'Document analyst training and competency assessments', category: 'Personnel', priority: 'medium' },
      { title: 'LIMS Implementation', description: 'Implement laboratory information management system', category: 'Systems', priority: 'medium' },
      { title: 'Chain of Custody Procedures', description: 'Document sample handling and chain of custody', category: 'Quality', priority: 'high' },
      { title: 'Uncertainty Calculations', description: 'Complete measurement uncertainty calculations for all methods', category: 'Technical', priority: 'high' }
    ]
  },
  {
    id: 'default-5',
    name: 'New Product Launch Compliance',
    description: 'Ensure regulatory compliance when launching new cannabis products including packaging, labeling, and testing requirements.',
    business_type: 'all',
    category: 'product_launch',
    usage_count: 134,
    average_rating: 4.5,
    rating_count: 24,
    template_items: [
      { title: 'Product Registration', description: 'Register new product with state regulatory agency', category: 'Regulatory', priority: 'high' },
      { title: 'Lab Testing', description: 'Complete all required potency and safety testing', category: 'Testing', priority: 'high' },
      { title: 'Label Compliance Review', description: 'Verify label meets all state requirements', category: 'Packaging', priority: 'high' },
      { title: 'Child-Resistant Packaging', description: 'Ensure packaging meets child-resistant requirements', category: 'Packaging', priority: 'high' },
      { title: 'Marketing Material Review', description: 'Review all marketing for compliance', category: 'Marketing', priority: 'medium' },
      { title: 'Staff Training', description: 'Train staff on new product specifications', category: 'Training', priority: 'medium' },
      { title: 'Allergen Assessment', description: 'Complete allergen assessment for edible products', category: 'Quality', priority: 'high' },
      { title: 'Serving Size Verification', description: 'Verify serving sizes comply with state limits', category: 'Compliance', priority: 'high' }
    ]
  },
  {
    id: 'default-6',
    name: 'Hemp CBD Product Compliance',
    description: 'Compliance checklist for hemp-derived CBD products including federal and state requirements.',
    business_type: 'manufacturer',
    category: 'product_launch',
    usage_count: 112,
    average_rating: 4.4,
    rating_count: 21,
    template_items: [
      { title: 'Hemp Source Verification', description: 'Verify hemp source is from licensed grower with COA', category: 'Sourcing', priority: 'high' },
      { title: 'THC Compliance Testing', description: 'Ensure product contains less than 0.3% THC', category: 'Testing', priority: 'high' },
      { title: 'FDA Labeling Compliance', description: 'Review labels for FDA compliance (no health claims)', category: 'Labeling', priority: 'high' },
      { title: 'State Registration', description: 'Register product in each state where sold', category: 'Regulatory', priority: 'high' },
      { title: 'COA Documentation', description: 'Maintain batch-specific certificates of analysis', category: 'Documentation', priority: 'medium' },
      { title: 'GMP Compliance', description: 'Verify manufacturing follows GMP guidelines', category: 'Quality', priority: 'high' },
      { title: 'Heavy Metals Testing', description: 'Complete heavy metals testing for all batches', category: 'Testing', priority: 'high' },
      { title: 'Pesticide Screening', description: 'Screen for pesticides per state requirements', category: 'Testing', priority: 'high' }
    ]
  },
  {
    id: 'default-7',
    name: 'Delivery Service Compliance',
    description: 'Compliance checklist for cannabis delivery operations including vehicle requirements, driver training, and security protocols.',
    business_type: 'retailer',
    category: 'new_license',
    usage_count: 98,
    average_rating: 4.6,
    rating_count: 15,
    template_items: [
      { title: 'Delivery License Application', description: 'Submit delivery endorsement or separate license application', category: 'Licensing', priority: 'high' },
      { title: 'Vehicle Registration', description: 'Register all delivery vehicles with state agency', category: 'Licensing', priority: 'high' },
      { title: 'GPS Tracking Setup', description: 'Install and test GPS tracking in all vehicles', category: 'Security', priority: 'high' },
      { title: 'Driver Background Checks', description: 'Complete background checks for all drivers', category: 'Personnel', priority: 'high' },
      { title: 'Driver Training Program', description: 'Develop and conduct driver training on compliance', category: 'Training', priority: 'high' },
      { title: 'Cash Handling Procedures', description: 'Establish secure cash handling protocols', category: 'Security', priority: 'high' },
      { title: 'Age Verification System', description: 'Implement ID scanning and age verification', category: 'Compliance', priority: 'high' },
      { title: 'Vehicle Security Features', description: 'Install lockboxes and security features in vehicles', category: 'Security', priority: 'high' }
    ]
  },
  {
    id: 'default-8',
    name: 'Social Equity Application Support',
    description: 'Checklist for social equity cannabis license applicants including documentation and program requirements.',
    business_type: 'all',
    category: 'new_license',
    usage_count: 76,
    average_rating: 4.8,
    rating_count: 12,
    template_items: [
      { title: 'Eligibility Verification', description: 'Gather documentation proving social equity eligibility', category: 'Documentation', priority: 'high' },
      { title: 'Residency Documentation', description: 'Compile proof of residency in qualifying area', category: 'Documentation', priority: 'high' },
      { title: 'Income Verification', description: 'Gather income documentation if required', category: 'Documentation', priority: 'medium' },
      { title: 'Business Plan Development', description: 'Create comprehensive business plan', category: 'Planning', priority: 'high' },
      { title: 'Funding Source Documentation', description: 'Document all funding sources and investors', category: 'Financial', priority: 'high' },
      { title: 'Community Benefit Plan', description: 'Develop community reinvestment plan', category: 'Planning', priority: 'medium' },
      { title: 'Technical Assistance', description: 'Apply for available technical assistance programs', category: 'Support', priority: 'medium' },
      { title: 'Fee Waiver Application', description: 'Apply for license fee waivers if available', category: 'Financial', priority: 'medium' }
    ]
  }
];

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDefaults, setUsingDefaults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterAndSortTemplates();
  }, [templates, searchQuery, businessTypeFilter, categoryFilter, sortBy]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        setTemplates(defaultTemplates);
        setUsingDefaults(true);
      } else if (!data || data.length === 0) {
        setTemplates(defaultTemplates);
        setUsingDefaults(true);
      } else {
        const processedData = data.map(t => ({
          ...t,
          template_items: Array.isArray(t.template_items) ? t.template_items : [],
          average_rating: t.average_rating || 0,
          rating_count: t.rating_count || 0,
          usage_count: t.usage_count || 0
        }));
        setTemplates(processedData);
        setUsingDefaults(false);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setTemplates(defaultTemplates);
      setUsingDefaults(true);
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    setSeeding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Sign In Required', description: 'Please sign in to seed the database', variant: 'destructive' });
        return;
      }

      // Check for existing templates
      const { data: existing } = await supabase
        .from('checklist_templates')
        .select('name');

      const existingNames = new Set((existing || []).map((t: any) => t.name));
      const toInsert = defaultTemplates
        .filter(t => !existingNames.has(t.name))
        .map(({ id, ...rest }) => ({
          ...rest,
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

      if (toInsert.length === 0) {
        toast({ title: 'Already Seeded', description: 'All templates already exist in the database' });
        return;
      }

      const { data, error } = await supabase
        .from('checklist_templates')
        .insert(toInsert)
        .select();

      if (error) {
        throw error;
      }

      toast({ 
        title: 'Success', 
        description: `Seeded ${data?.length || 0} templates to the database` 
      });
      
      // Refresh templates
      await fetchTemplates();
    } catch (error: any) {
      console.error('Seed error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to seed database', 
        variant: 'destructive' 
      });
    } finally {
      setSeeding(false);
    }
  };

  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    if (businessTypeFilter !== 'all') {
      filtered = filtered.filter(t => 
        t.business_type === businessTypeFilter || t.business_type === 'all'
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'popular') return (b.usage_count || 0) - (a.usage_count || 0);
      if (sortBy === 'rating') return (b.average_rating || 0) - (a.average_rating || 0);
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0;
    });

    setFilteredTemplates(filtered);
  };

  const handleGenerate = async (template: any) => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Sign In Required', description: 'Please sign in to generate checklists from templates', variant: 'destructive' });
        navigate('/login');
        return;
      }

      // For default templates or if edge function fails, create directly
      const createDirectly = async () => {
        const { data: checklistData, error: checklistError } = await supabase
          .from('compliance_checklists')
          .insert({
            name: template.name,
            description: template.description,
            business_type: template.business_type,
            states: template.states || [],
            created_by: session.user.id
          })
          .select()
          .limit(1);

        if (checklistError) {
          throw new Error('Failed to create checklist: ' + checklistError.message);
        }

        const checklist = checklistData?.[0];
        if (!checklist) {
          throw new Error('Failed to create checklist');
        }

        const items = (template.template_items || []).map((item: any, index: number) => ({
          checklist_id: checklist.id,
          title: item.title || 'Untitled',
          description: item.description || '',
          category: item.category || 'General',
          priority: item.priority || 'medium',
          completed: false,
          sort_order: index
        }));

        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('checklist_items')
            .insert(items);

          if (itemsError) {
            console.error('Error creating items:', itemsError);
          }
        }

        return checklist.id;
      };

      // For default templates, create directly
      if (template.id?.startsWith('default-')) {
        await createDirectly();
        toast({ title: 'Success', description: 'Checklist created from template!' });
        navigate('/checklists');
        return;
      }

      // For database templates, try the edge function first
      try {
        const { data, error } = await supabase.functions.invoke('generate-checklist-from-template', {
          body: { 
            templateId: template.id,
            enableAI: true,
            includeAITips: true
          }
        });

        if (error) {
          console.warn('Edge function failed, falling back to direct creation:', error);
          await createDirectly();
        } else if (data?.complianceTips?.length > 0) {
          // Show AI tips if available
          toast({ 
            title: 'Checklist Created with AI Insights', 
            description: `${data.stats?.aiGeneratedItems || 0} AI-suggested items added. ${data.complianceTips[0]}`
          });
          navigate('/checklists');
          return;
        }
      } catch (funcError) {
        console.warn('Edge function error, falling back:', funcError);
        await createDirectly();
      }

      toast({ title: 'Success', description: 'Checklist created from template!' });
      navigate('/checklists');
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate checklist', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Compliance Template Library</h1>
          <p className="text-muted-foreground">Browse pre-built templates and generate AI-enhanced checklists instantly</p>
        </div>
        {usingDefaults && (
          <Button onClick={seedDatabase} disabled={seeding} variant="outline" className="gap-2">
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {seeding ? 'Seeding...' : 'Seed Database'}
          </Button>
        )}
      </div>

      {usingDefaults && (
        <Alert className="mb-6">
          <FileText className="h-4 w-4" />
          <AlertTitle>Using Default Templates</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            Showing built-in compliance templates. Click "Seed Database" to populate the database for full functionality including ratings and usage tracking.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="font-semibold">AI-Powered Checklists</span>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-700">New</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          When you generate a checklist from a template, our AI analyzes your business type and selected states to suggest additional compliance items and provide expert tips.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="template-search"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search templates"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="business-type-filter" className="sr-only">Business Type</Label>
          <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
            <SelectTrigger id="business-type-filter" aria-label="Filter by business type">
              <SelectValue placeholder="Business Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="cultivator">Cultivator</SelectItem>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
              <SelectItem value="retailer">Retailer</SelectItem>
              <SelectItem value="testing_lab">Testing Lab</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category-filter" className="sr-only">Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="category-filter" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="new_license">New License</SelectItem>
              <SelectItem value="annual_renewal">Annual Renewal</SelectItem>
              <SelectItem value="inspection_prep">Inspection Prep</SelectItem>
              <SelectItem value="product_launch">Product Launch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
        <div>
          <Label htmlFor="sort-by" className="sr-only">Sort by</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-by" className="w-[180px]" aria-label="Sort templates">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPreview={setPreviewTemplate}
            onGenerate={handleGenerate}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      )}

      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onGenerate={handleGenerate}
      />

      {generating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="font-medium">Generating checklist...</span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI is analyzing compliance requirements
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
