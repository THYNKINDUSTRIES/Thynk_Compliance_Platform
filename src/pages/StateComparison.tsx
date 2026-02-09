import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Scale, FileText, Calendar, AlertCircle, Building2, TestTube, Package, Download } from 'lucide-react';
import { generateComparisonPDF } from '@/lib/pdfGenerator';

import { US_STATES } from '@/data/states';

import { arizonaDetail } from '@/data/azData';
import { californiaDetail } from '@/data/caData';
import { coloradoDetail } from '@/data/coData';
import { floridaDetail } from '@/data/flData';
import { illinoisDetail } from '@/data/ilData';
import { massachusettsDetail } from '@/data/maData';
import { michiganDetail } from '@/data/miData';
import { newJerseyDetail } from '@/data/njData';
import { nevadaDetail } from '@/data/nvData';
import { newYorkDetail } from '@/data/nyData';
import { oregonDetail } from '@/data/orData';
import { pennsylvaniaDetail } from '@/data/paData';
import { texasDetail } from '@/data/txData';
import { virginiaDetail } from '@/data/vaData';
import { washingtonDetail } from '@/data/waData';
import ComparisonStatsCard from '@/components/ComparisonStatsCard';
import ComparisonTimeline from '@/components/ComparisonTimeline';
import LicensingComparison from '@/components/LicensingComparison';

const stateDetailsMap: Record<string, any> = {
  'arizona': arizonaDetail, 'california': californiaDetail, 'colorado': coloradoDetail,
  'florida': floridaDetail, 'illinois': illinoisDetail, 'massachusetts': massachusettsDetail,
  'michigan': michiganDetail, 'new-jersey': newJerseyDetail, 'nevada': nevadaDetail,
  'new-york': newYorkDetail, 'oregon': oregonDetail, 'pennsylvania': pennsylvaniaDetail,
  'texas': texasDetail, 'virginia': virginiaDetail, 'washington': washingtonDetail
};

export default function StateComparison() {
  const { state1, state2 } = useParams<{ state1: string; state2: string }>();
  const navigate = useNavigate();

  const allStates = US_STATES;
  const stateData1 = allStates.find(s => s.slug === state1);
  const stateData2 = allStates.find(s => s.slug === state2);
  const detail1 = state1 ? stateDetailsMap[state1] : null;
  const detail2 = state2 ? stateDetailsMap[state2] : null;

  if (!stateData1 || !stateData2) {
    return <div className="container mx-auto p-6"><Card><CardContent className="p-6"><p className="text-center">States not found</p></CardContent></Card></div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => navigate(-1)} variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        {detail1 && detail2 && (
          <Button onClick={() => generateComparisonPDF(stateData1, stateData2, detail1, detail2)} className="gap-2">
            <Download className="h-4 w-4" /> Export PDF Report
          </Button>
        )}
      </div>
      <div className="mb-6"><h1 className="text-3xl font-bold flex items-center gap-2"><Scale className="h-8 w-8" />State Comparison</h1><p className="text-muted-foreground mt-2">Compare regulations between {stateData1.name} and {stateData2.name}</p></div>


      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card><CardHeader><CardTitle>{stateData1.name}</CardTitle></CardHeader><CardContent className="space-y-4"><div><h3 className="font-semibold mb-2">Status</h3><Badge variant={stateData1.status === 'legal' ? 'default' : 'destructive'}>{stateData1.status}</Badge></div><div><h3 className="font-semibold mb-2">Description</h3><p className="text-sm">{stateData1.description}</p></div></CardContent></Card>
        <Card><CardHeader><CardTitle>{stateData2.name}</CardTitle></CardHeader><CardContent className="space-y-4"><div><h3 className="font-semibold mb-2">Status</h3><Badge variant={stateData2.status === 'legal' ? 'default' : 'destructive'}>{stateData2.status}</Badge></div><div><h3 className="font-semibold mb-2">Description</h3><p className="text-sm">{stateData2.description}</p></div></CardContent></Card>
      </div>

      {detail1 && detail2 && (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <ComparisonStatsCard title="Timeline Events" state1Value={detail1.timeline?.length || 0} state2Value={detail2.timeline?.length || 0} state1Name={stateData1.name} state2Name={stateData2.name} icon={Calendar} />
            <ComparisonStatsCard title="Deadlines" state1Value={detail1.deadlines?.length || 0} state2Value={detail2.deadlines?.length || 0} state1Name={stateData1.name} state2Name={stateData2.name} icon={AlertCircle} />
            <ComparisonStatsCard title="License Types" state1Value={detail1.licensing?.length || 0} state2Value={detail2.licensing?.length || 0} state1Name={stateData1.name} state2Name={stateData2.name} icon={FileText} />
            <ComparisonStatsCard title="Authorities" state1Value={detail1.authorities?.length || 0} state2Value={detail2.authorities?.length || 0} state1Name={stateData1.name} state2Name={stateData2.name} icon={Building2} />
          </div>

          <div className="mb-6"><ComparisonTimeline state1Name={stateData1.name} state2Name={stateData2.name} state1Timeline={detail1.timeline || []} state2Timeline={detail2.timeline || []} /></div>
          <div className="mb-6"><LicensingComparison state1Name={stateData1.name} state2Name={stateData2.name} state1Licensing={detail1.licensing || []} state2Licensing={detail2.licensing || []} /></div>
        </>
      )}
    </div>
  );
}

