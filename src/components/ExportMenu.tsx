import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileImage, FileText, Printer } from 'lucide-react';

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
}

export default function ExportMenu({ 
  onExportCSV, 
  onExportExcel, 
  onExportPNG, 
  onExportPDF, 
  onPrint 
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (exportFn: () => void | Promise<void>) => {
    setIsExporting(true);
    try {
      await exportFn();
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport(onExportCSV)}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(onExportExcel)}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport(onExportPNG)}>
          <FileImage className="w-4 h-4 mr-2" />
          Export Charts as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(onExportPDF)}>
          <FileText className="w-4 h-4 mr-2" />
          Generate PDF Report
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport(onPrint)}>
          <Printer className="w-4 h-4 mr-2" />
          Print View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
