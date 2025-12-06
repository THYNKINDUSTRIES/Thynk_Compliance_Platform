import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Terminal, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  functionName: string;
  code: string;
  onConfirmDeployment: () => void;
}

export default function DeploymentInstructions({ functionName, code, onConfirmDeployment }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Terminal className="w-5 h-5" />
        Deployment Instructions
      </h3>

      <Alert className="mb-4">
        <Upload className="w-4 h-4" />
        <AlertDescription>
          Follow these steps to deploy your edge function to Supabase
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Step 1: Copy Function Code</h4>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm max-h-64">
              {code}
            </pre>
            <Button
              size="sm"
              className="absolute top-2 right-2"
              onClick={copyCode}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Step 2: Deploy via Supabase Dashboard</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Go to your Supabase Dashboard</li>
            <li>Navigate to Edge Functions</li>
            <li>Find or create function: <code className="bg-gray-100 px-2 py-1 rounded">{functionName}</code></li>
            <li>Paste the code you copied above</li>
            <li>Click "Deploy" button</li>
          </ol>
        </div>

        <div>
          <h4 className="font-medium mb-2">Step 3: Confirm Deployment</h4>
          <p className="text-sm text-gray-600 mb-3">
            After deploying in Supabase Dashboard, click below to mark as deployed:
          </p>
          <Button onClick={onConfirmDeployment} className="w-full">
            Confirm Deployment Complete
          </Button>
        </div>
      </div>
    </Card>
  );
}
