import { LicenseRequirement, TestingRequirement, PackagingRequirement } from '@/data/stateDetails';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface RequirementsDisplayProps {
  licensing: LicenseRequirement[];
  testing: TestingRequirement[];
  packaging: PackagingRequirement[];
}

export const RequirementsDisplay = ({ licensing, testing, packaging }: RequirementsDisplayProps) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4">Licensing Requirements</h3>
        <div className="grid gap-4">
          {licensing.map((lic, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">{lic.type}</h4>
                <Badge variant="outline">{lic.authority}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-3 mb-3 text-sm">
                <div><span className="font-medium">Application Fee:</span> {lic.fee}</div>
                <div><span className="font-medium">Renewal:</span> {lic.renewal}</div>
              </div>
              <div className="mt-3">
                <p className="font-medium text-sm mb-2">Requirements:</p>
                <ul className="space-y-1">
                  {lic.requirements.map((req, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Testing Requirements</h3>
        <div className="grid gap-4">
          {testing.map((test, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-lg mb-3">{test.product}</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Required Analytes:</p>
                  <div className="flex flex-wrap gap-2">
                    {test.analytes.map((analyte, i) => (
                      <Badge key={i} variant="secondary">{analyte}</Badge>
                    ))}
                  </div>
                </div>
                <div><span className="font-medium">Action Levels:</span> {test.actionLevels}</div>
                <div><span className="font-medium">Lab Accreditation:</span> {test.labAccreditation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Packaging & Labeling</h3>
        <div className="grid gap-4">
          {packaging.map((pkg, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">{pkg.product}</h4>
                <div className="flex items-center gap-2">
                  {pkg.childResistant ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-sm">Child-Resistant Required</span></>
                  ) : (
                    <><XCircle className="w-4 h-4 text-gray-400" /><span className="text-sm">Child-Resistant Not Required</span></>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm mb-2">Required Warnings:</p>
                  <ul className="space-y-1">
                    {pkg.warnings.map((warn, i) => (
                      <li key={i} className="text-sm text-gray-700 pl-4 border-l-2 border-yellow-400">{warn}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Labeling Requirements:</p>
                  <ul className="space-y-1">
                    {pkg.labeling.map((label, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {pkg.restrictions.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2">Restrictions:</p>
                    <ul className="space-y-1">
                      {pkg.restrictions.map((rest, i) => (
                        <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span>{rest}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
