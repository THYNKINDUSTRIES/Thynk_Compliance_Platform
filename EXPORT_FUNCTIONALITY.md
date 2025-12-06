# Analytics Dashboard Export Functionality

## Overview
The Analytics Dashboard now includes comprehensive export functionality allowing users to download charts as PNG images, export data as CSV or Excel files, generate PDF reports, and print the dashboard.

## Features

### 1. CSV Export
- Exports all regulation data in CSV format
- Includes: Title, Jurisdiction, Authority, Status, Impact, Published Date, Products, Citation
- Filename format: `regulations-analytics-YYYY-MM-DD.csv`

### 2. Excel Export
- Exports all regulation data in Excel format (.xlsx)
- Same data structure as CSV
- Filename format: `regulations-analytics-YYYY-MM-DD.xlsx`

### 3. PNG Chart Export
- Exports each chart section as individual PNG images
- Includes: Stats Overview, Time Chart, Jurisdiction Chart, Impact Chart, Authority Chart, Product Chart
- High resolution (2x scale) for quality output
- Filename format: `[chart-id]-YYYY-MM-DD.png`

### 4. PDF Report Generation
- Generates a comprehensive PDF report with all charts
- Each chart is captured and included in the PDF
- Optimized for A4 page size
- Filename format: `analytics-report-YYYY-MM-DD.pdf`

### 5. Print-Friendly View
- Opens browser print dialog
- Automatically hides header, footer, and navigation
- Optimized layout for printing
- Preserves chart colors and formatting

## Usage

### Accessing Export Options
1. Navigate to the Analytics Dashboard
2. Click the "Export" button in the top-right corner of the page
3. Select your desired export option from the dropdown menu

### Export Menu Options
- **Export as CSV**: Downloads regulation data in CSV format
- **Export as Excel**: Downloads regulation data in Excel format
- **Export Charts as PNG**: Downloads all charts as individual PNG files
- **Generate PDF Report**: Creates a single PDF with all charts
- **Print View**: Opens the browser's print dialog

## Technical Implementation

### Dependencies
```json
{
  "html2canvas": "^1.4.1",
  "jspdf": "^2.5.2",
  "xlsx": "^0.18.5"
}
```

### Export Utilities (`src/lib/exportUtils.ts`)
- `exportToCSV()`: Converts data to CSV and triggers download
- `exportToExcel()`: Uses xlsx library to create Excel files
- `exportChartToPNG()`: Uses html2canvas to capture chart elements
- `exportToPDF()`: Combines html2canvas and jsPDF for PDF generation

### Components
- **ExportMenu** (`src/components/ExportMenu.tsx`): Dropdown menu with export options
- **Analytics Page** (`src/pages/Analytics.tsx`): Main dashboard with export functionality

## Print Styles
Custom CSS media queries ensure optimal printing:
- A4 page size with 1cm margins
- Header and footer hidden
- Chart colors preserved
- Responsive canvas sizing

## Best Practices
1. **Before Exporting**: Ensure all filters are applied to get the desired data subset
2. **PNG Exports**: Wait for all charts to fully render before exporting
3. **PDF Reports**: Large datasets may take a few seconds to generate
4. **Print View**: Use "Save as PDF" in print dialog for digital copies

## Troubleshooting

### Charts not appearing in exports
- Ensure charts have fully loaded before clicking export
- Check browser console for any errors
- Verify chart IDs are correctly assigned

### Excel export not working
- Ensure xlsx library is properly installed
- Check browser compatibility (modern browsers required)

### PDF generation slow
- Large datasets require more processing time
- Consider filtering data to reduce chart complexity

## Future Enhancements
- Custom date range selection for exports
- Email report functionality
- Scheduled report generation
- Export templates with branding
- Batch export for multiple filter combinations
