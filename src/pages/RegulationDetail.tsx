import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Printer, Download, Calendar, FileText, Building2, Tag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Regulation } from '@/hooks/useRegulations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RegulationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedRegs, setRelatedRegs] = useState<Regulation[]>([]);

  useEffect(() => {
    fetchRegulation();
  }, [id]);

  const fetchRegulation = async () => {
    try {
      const { data, error } = await supabase
        .from('instrument')
        .select(`
          id, title, summary, status, products, stages,
          instrument_type, published_at, effective_at,
          citation, url, impact,
          jurisdiction:jurisdiction_id(name),
          authority:authority_id(acronym, name)
        `)
        .eq('id', id)
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Not found');

      const item = data[0];
      const reg: Regulation = {
        id: item.id,
        title: item.title,
        summary: item.summary || '',
        jurisdiction: item.jurisdiction?.name || 'Unknown',
        authority: item.authority?.acronym || 'Unknown',
        status: item.status || 'unknown',
        products: item.products || [],
        stages: item.stages || [],
        instrumentType: item.instrument_type || 'Unknown',
        publishedAt: item.published_at?.split('T')[0] || '',
        effectiveAt: item.effective_at?.split('T')[0],
        citation: item.citation,
        url: item.url || '#',
        impact: item.impact || 'medium',
      };

      setRegulation(reg);



      // Fetch related regulations
      const { data: related } = await supabase
        .from('instrument')
        .select('id, title, jurisdiction:jurisdiction_id(name), published_at')
        .neq('id', id)
        .limit(5);

      if (related) {
        setRelatedRegs(related.map((r: any) => ({
          id: r.id,
          title: r.title,
          jurisdiction: r.jurisdiction?.name || 'Unknown',
          publishedAt: r.published_at?.split('T')[0] || '',
        })) as any);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Regulation Detail Report', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 15;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    const titleLines = doc.splitTextToSize(regulation.title, pageWidth - 2 * margin);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 7 + 10;

    // Metadata Table
    autoTable(doc, {
      startY: yPos,
      head: [['Property', 'Value']],
      body: [
        ['Jurisdiction', regulation.jurisdiction],
        ['Authority', regulation.authority],
        ['Type', regulation.instrumentType],
        ['Status', regulation.status],
        ['Impact', regulation.impact.toUpperCase()],
        ['Published Date', regulation.publishedAt],
        ['Effective Date', regulation.effectiveAt || 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(regulation.summary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 5 + 10;

    // Products & Stages
    if (regulation.products.length > 0 || regulation.stages.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      autoTable(doc, {
        startY: yPos,
        head: [['Products', 'Stages']],
        body: [[
          regulation.products.join(', ') || 'N/A',
          regulation.stages.join(', ') || 'N/A'
        ]],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Citation
    if (regulation.citation) {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Citation', margin, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const citationLines = doc.splitTextToSize(regulation.citation, pageWidth - 2 * margin);
      doc.text(citationLines, margin, yPos);
      yPos += citationLines.length * 5 + 10;
    }

    // URL
    if (regulation.url && regulation.url !== '#') {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.textWithLink('View Official Document', margin, yPos, { url: regulation.url });
    }

    // Save PDF
    const fileName = `regulation_${regulation.id}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!regulation) return <div className="min-h-screen flex items-center justify-center">Not found</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/dashboard" className="text-blue-600 hover:underline">Regulations</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{regulation.title}</span>
        </nav>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold flex-1">{regulation.title}</h1>
            <Badge className={
              regulation.impact === 'high' ? 'bg-red-500' :
              regulation.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }>
              {regulation.impact.toUpperCase()} IMPACT
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Jurisdiction</div>
              <div className="font-medium">{regulation.jurisdiction}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Authority</div>
              <div className="font-medium">{regulation.authority}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Type</div>
              <div className="font-medium">{regulation.instrumentType}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <Badge variant="outline">{regulation.status}</Badge>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{regulation.summary}</p>
          </div>

          <Separator className="my-6" />

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                Products
              </h3>
              <div className="flex flex-wrap gap-2">
                {regulation.products.map((p, i) => (
                  <Badge key={i} variant="secondary">{p}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                Stages
              </h3>
              <div className="flex flex-wrap gap-2">
                {regulation.stages.map((s, i) => (
                  <Badge key={i} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Published Date
              </h3>
              <p>{regulation.publishedAt}</p>
            </div>
            {regulation.effectiveAt && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Effective Date
                </h3>
                <p>{regulation.effectiveAt}</p>
              </div>
            )}
          </div>

          {regulation.citation && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-2">Citation</h3>
                <p className="text-gray-700">{regulation.citation}</p>
              </div>
            </>
          )}

          <Separator className="my-6" />

          <div>
            {regulation.url && regulation.url !== '#' ? (
              <a href={regulation.url} target="_blank" rel="noopener noreferrer">
                <Button className="w-full sm:w-auto">
                  View Official Document
                </Button>
              </a>
            ) : (
              <div className="text-gray-500 italic">
                External source not available for this regulation
              </div>
            )}
          </div>

        </Card>

        {/* Related Regulations */}
        {relatedRegs.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Related Regulations</h2>
            <div className="space-y-3">
              {relatedRegs.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/regulations/${rel.id}`}
                  className="block p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div className="font-medium">{rel.title}</div>
                  <div className="text-sm text-gray-500">
                    {rel.jurisdiction} • {rel.publishedAt}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
        {regulation && <PublicComments regulationId={regulation.id} />}
      </main>
      <Footer />
    </div>
  );
};
function PublicComments({ regulationId }: { regulationId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('public_comments')
        .select('id, comment_title, comment_body, agency_name, created_at')
        .eq('regulation_id', regulationId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) console.error('Comments error:', error);
      else setComments(data || []);
      setLoading(false);
    };

    if (regulationId) fetchComments();
  }, [regulationId]);

  if (loading) return <div className="text-center py-8">Loading public comments...</div>;
  if (comments.length === 0) return null; // or <div className="text-gray-500">No public comments yet.</div>

  return (
    <Card className="p-6 mt-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        Public Comments ({comments.length})
      </h2>
      <div className="space-y-6">
        {comments.map((c) => (
          <div key={c.id} className="border-l-4 border-blue-500 pl-4">
            <div className="font-semibold text-lg">{c.comment_title}</div>
            <div className="text-sm text-gray-600 mb-2">
              {c.agency_name || 'Anonymous'} • {new Date(c.created_at).toLocaleDateString()}
            </div>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {c.comment_body}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
export default RegulationDetail;
