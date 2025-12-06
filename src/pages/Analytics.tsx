import { useMemo, useRef, useState } from 'react';
import { useRegulations } from '@/hooks/useRegulations';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ExportMenu from '@/components/ExportMenu';
import TeamAnalyticsDashboard from '@/components/TeamAnalyticsDashboard';
import { DatabaseOptimization } from '@/components/DatabaseOptimization';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Building2, AlertCircle, Users, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToCSV, exportToExcel, exportChartToPNG, exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';


const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];


export default function Analytics() {
  const { filters } = useAppContext();
  
  // Refs for export functionality
  const statsRef = useRef<HTMLDivElement>(null);
  const timeChartRef = useRef<HTMLDivElement>(null);
  const jurisdictionChartRef = useRef<HTMLDivElement>(null);
  const impactChartRef = useRef<HTMLDivElement>(null);
  const authorityChartRef = useRef<HTMLDivElement>(null);
  const productChartRef = useRef<HTMLDivElement>(null);
  
  // Convert AppContext filters to useRegulations format
  const regulationFilters = useMemo(() => ({
    search: filters.search,
    jurisdictions: filters.jurisdictions,
    authorities: filters.authorities,
    statuses: filters.statuses,
    impactLevels: filters.impactLevels,
    products: filters.products,
    stages: filters.stages,
    types: filters.types,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  }), [filters]);
  
  const { regulations, loading } = useRegulations(regulationFilters);


  // Process data for charts
  const chartData = useMemo(() => {
    // Regulations over time (by month)
    const timeData = regulations.reduce((acc: any, reg) => {
      const date = new Date(reg.publishedAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {});

    const sortedTimeData = Object.entries(timeData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));

    // Jurisdiction distribution
    const jurisdictionData = Object.entries(
      regulations.reduce((acc: any, reg) => {
        acc[reg.jurisdiction] = (acc[reg.jurisdiction] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    // Impact level distribution
    const impactData = Object.entries(
      regulations.reduce((acc: any, reg) => {
        acc[reg.impact] = (acc[reg.impact] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    // Most active authorities
    const authorityData = Object.entries(
      regulations.reduce((acc: any, reg) => {
        acc[reg.authority] = (acc[reg.authority] || 0) + 1;
        return acc;
      }, {})
    )
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    // Product category breakdown
    const productData = Object.entries(
      regulations.reduce((acc: any, reg) => {
        reg.products.forEach((product: string) => {
          acc[product] = (acc[product] || 0) + 1;
        });
        return acc;
      }, {})
    )
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));


    return { sortedTimeData, jurisdictionData, impactData, authorityData, productData };
  }, [regulations]);


  // Export handler functions
  const handleExportCSV = () => {
    const csvData = regulations.map(reg => ({
      Title: reg.title,
      Jurisdiction: reg.jurisdiction,
      Authority: reg.authority,
      Status: reg.status,
      Impact: reg.impact,
      Published: reg.publishedAt,
      Products: reg.products.join('; '),
      Citation: reg.citation,
    }));
    exportToCSV(csvData, `regulations-analytics-${new Date().toISOString().split('T')[0]}`);
    toast.success('Data exported to CSV successfully!');
  };

  const handleExportExcel = () => {
    const excelData = regulations.map(reg => ({
      Title: reg.title,
      Jurisdiction: reg.jurisdiction,
      Authority: reg.authority,
      Status: reg.status,
      Impact: reg.impact,
      Published: reg.publishedAt,
      Products: reg.products.join('; '),
      Citation: reg.citation,
    }));
    exportToExcel(excelData, `regulations-analytics-${new Date().toISOString().split('T')[0]}`);
    toast.success('Data exported to Excel successfully!');
  };

  const handleExportPNG = async () => {
    const chartIds = ['stats-section', 'time-chart', 'jurisdiction-chart', 'impact-chart', 'authority-chart', 'product-chart'];
    for (const id of chartIds) {
      await exportChartToPNG(id, `${id}-${new Date().toISOString().split('T')[0]}`);
    }
    toast.success('All charts exported as PNG successfully!');
  };

  const handleExportPDF = async () => {
    const chartIds = ['stats-section', 'time-chart', 'jurisdiction-chart', 'impact-chart', 'authority-chart', 'product-chart'];
    await exportToPDF(chartIds, `analytics-report-${new Date().toISOString().split('T')[0]}`);
    toast.success('PDF report generated successfully!');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog...');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into regulations, team performance, and database optimization</p>
        </div>

        <Tabs defaultValue="regulations" className="space-y-6">


          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="regulations">Regulation Analytics</TabsTrigger>
            <TabsTrigger value="team">Team Analytics</TabsTrigger>
            <TabsTrigger value="database">Database Optimization</TabsTrigger>
          </TabsList>


          <TabsContent value="regulations" className="space-y-6">
            <div className="flex justify-end mb-4">
              <ExportMenu
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPNG={handleExportPNG}
                onExportPDF={handleExportPDF}
                onPrint={handlePrint}
              />
            </div>


        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : (
          <div className="grid gap-6">
            {/* Stats Overview */}
            <div id="stats-section" className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{regulations.length}</div>
                  <p className="text-sm text-gray-600">Total Regulations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{chartData.jurisdictionData.length}</div>
                  <p className="text-sm text-gray-600">Jurisdictions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{chartData.authorityData.length}</div>
                  <p className="text-sm text-gray-600">Authorities</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-600">{chartData.productData.length}</div>
                  <p className="text-sm text-gray-600">Product Categories</p>
                </CardContent>
              </Card>
            </div>

            {/* Regulations Over Time */}

            <Card id="time-chart">

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Regulations Over Time
                </CardTitle>
                <CardDescription>Monthly trend of published regulations</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <LineChart data={chartData.sortedTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Jurisdiction Distribution */}
              <Card id="jurisdiction-chart">

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    By Jurisdiction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <PieChart>
                      <Pie data={chartData.jurisdictionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {chartData.jurisdictionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Impact Level Distribution */}
              <Card id="impact-chart">

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    By Impact Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <BarChart data={chartData.impactData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Most Active Authorities */}
            <Card id="authority-chart">

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Most Active Authorities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <BarChart data={chartData.authorityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Product Category Breakdown */}
            <Card id="product-chart">

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <BarChart data={chartData.productData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}
          </TabsContent>

          <TabsContent value="team">
            <TeamAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseOptimization />
          </TabsContent>
        </Tabs>

      </main>
      <Footer />
    </div>
  );
}
