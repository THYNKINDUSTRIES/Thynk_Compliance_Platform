import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, User, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface Version {
  id: string;
  version: number;
  description: string;
  deployed_at: string;
  deployed_by: string;
  is_active: boolean;
  status: string;
}

interface Props {
  versions: Version[];
  onRollback: (versionId: string) => void;
  onViewCode: (versionId: string) => void;
}

export default function FunctionVersionList({ versions, onRollback, onViewCode }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'rolled_back': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      {versions.map((version) => (
        <Card key={version.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold">Version {version.version}</h4>
                {version.is_active && (
                  <Badge variant="default">Active</Badge>
                )}
                <Badge className={getStatusColor(version.status)}>
                  {version.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{version.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(version.deployed_at).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {version.deployed_by}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onViewCode(version.id)}>
                View Code
              </Button>
              {!version.is_active && version.status === 'deployed' && (
                <Button size="sm" onClick={() => onRollback(version.id)}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Rollback
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
