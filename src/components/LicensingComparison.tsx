import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LicenseRequirement } from '@/data/stateDetails';
import { FileText } from 'lucide-react';

interface LicensingComparisonProps {
  state1Name: string;
  state2Name: string;
  state1Licensing: LicenseRequirement[];
  state2Licensing: LicenseRequirement[];
}

export default function LicensingComparison({ 
  state1Name, 
  state2Name, 
  state1Licensing, 
  state2Licensing 
}: LicensingComparisonProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {state1Name} Licensing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state1Licensing.map((license, idx) => (
            <div key={idx} className="border-b pb-3 last:border-b-0">
              <div className="font-semibold text-sm mb-2">{license.type}</div>
              <div className="text-xs space-y-1">
                <div><span className="font-medium">Authority:</span> {license.authority}</div>
                <div><span className="font-medium">Fee:</span> {license.fee}</div>
                <div><span className="font-medium">Renewal:</span> {license.renewal}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {state2Name} Licensing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state2Licensing.map((license, idx) => (
            <div key={idx} className="border-b pb-3 last:border-b-0">
              <div className="font-semibold text-sm mb-2">{license.type}</div>
              <div className="text-xs space-y-1">
                <div><span className="font-medium">Authority:</span> {license.authority}</div>
                <div><span className="font-medium">Fee:</span> {license.fee}</div>
                <div><span className="font-medium">Renewal:</span> {license.renewal}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
