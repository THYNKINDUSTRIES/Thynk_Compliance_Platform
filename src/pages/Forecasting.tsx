import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useForecasts, useGenerateForecasts, useRunScenario, type Forecast, type ScenarioResult } from '@/hooks/useForecasts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Sparkles,
  RefreshCw, Brain, Lightbulb, Target, ChevronRight, Loader2,
  ArrowUpRight, ArrowDownRight, BarChart3, Zap, Scale, Beaker
} from 'lucide-react';
import { toast } from 'sonner';

const PRODUCTS = [
  { value: 'all', label: 'All Products' },
  { value: 'cannabis', label: 'Cannabis' },
  { value: 'hemp', label: 'Hemp' },
  { value: 'kratom', label: 'Kratom' },
  { value: 'kava', label: 'Kava' },
  { value: 'nicotine', label: 'Nicotine' },
  { value: 'psychedelics', label: 'Psychedelics' },
];

const RISK_LEVELS = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

const RISK_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
};

const DIRECTION_ICONS: Record<string, React.ReactNode> = {
  restrictive: <ArrowDownRight className="w-4 h-4 text-red-500" />,
  permissive: <ArrowUpRight className="w-4 h-4 text-green-500" />,
  neutral: <Minus className="w-4 h-4 text-gray-500" />,
  deregulation: <TrendingUp className="w-4 h-4 text-emerald-500" />,
};

const DIRECTION_LABELS: Record<string, string> = {
  restrictive: 'Restrictive',
  permissive: 'Permissive',
  neutral: 'Neutral',
  deregulation: 'Deregulation',
};

function ConfidenceGauge({ value }: { value: number }) {
  const color = value >= 75 ? 'text-green-600' : value >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Progress value={value} className="h-2" />
      </div>
      <span className={`text-sm font-bold tabular-nums ${color}`}>{value}%</span>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: Forecast }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4"
      style={{ borderLeftColor: forecast.risk_level === 'critical' ? '#ef4444' : forecast.risk_level === 'high' ? '#f97316' : forecast.risk_level === 'medium' ? '#eab308' : '#22c55e' }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-xs capitalize">{forecast.product}</Badge>
              <Badge className={`text-xs ${RISK_COLORS[forecast.risk_level] || RISK_COLORS.medium}`}>
                {forecast.risk_level}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {DIRECTION_ICONS[forecast.direction]}
                <span>{DIRECTION_LABELS[forecast.direction] || forecast.direction}</span>
              </div>
            </div>
            <CardTitle className="text-base leading-tight">{forecast.title}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {forecast.jurisdiction?.name || 'Unknown Jurisdiction'}
              {forecast.predicted_quarter && ` · Predicted: ${forecast.predicted_quarter}`}
            </CardDescription>
          </div>
          <div className="w-24 flex-shrink-0">
            <ConfidenceGauge value={Number(forecast.confidence)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">{forecast.summary}</p>

        {expanded && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
            {forecast.rationale && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
                  <Brain className="w-4 h-4 text-purple-500" /> Analysis
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{forecast.rationale}</p>
              </div>
            )}

            {forecast.recommended_actions?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                  <Target className="w-4 h-4 text-blue-500" /> Recommended Actions
                </h4>
                <ul className="space-y-1">
                  {forecast.recommended_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-3 h-3 mt-1 text-blue-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {forecast.supporting_signals?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Supporting Signals
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {forecast.supporting_signals.map((signal, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">{signal}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              <span>Model: {forecast.model_version}</span>
              <span>Data points: {forecast.data_points_analyzed}</span>
              <span>Generated: {new Date(forecast.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs h-7"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show details'}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value, subtext, color }: {
  icon: React.ReactNode; label: string; value: string | number; subtext?: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioBuilder() {
  const { result, runScenario, clearScenario } = useRunScenario();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState('cannabis');
  const [assumption, setAssumption] = useState('');
  const [timeframe, setTimeframe] = useState('Next 12 months');

  const handleRun = async () => {
    if (!assumption.trim()) {
      toast.error('Please enter a scenario assumption');
      return;
    }
    setLoading(true);
    try {
      await runScenario({ product, assumption, timeframe });
      toast.success('Scenario analysis complete');
    } catch (err: any) {
      toast.error(err.message || 'Failed to run scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Product</label>
          <Select value={product} onValueChange={setProduct}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRODUCTS.filter(p => p.value !== 'all').map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Timeframe</label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Next 3 months">Next 3 months</SelectItem>
              <SelectItem value="Next 6 months">Next 6 months</SelectItem>
              <SelectItem value="Next 12 months">Next 12 months</SelectItem>
              <SelectItem value="Next 2 years">Next 2 years</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleRun} disabled={loading || !assumption.trim()} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Beaker className="w-4 h-4 mr-2" />}
            {loading ? 'Analyzing…' : 'Run Scenario'}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">What-If Assumption</label>
        <Textarea
          placeholder="e.g., What if the DEA reschedules cannabis to Schedule III? What if New York bans delta-8 THC? What if the FDA approves kratom as a dietary supplement?"
          value={assumption}
          onChange={(e) => setAssumption(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {result && (
        <ScenarioResultDisplay result={result} onClear={clearScenario} />
      )}
    </div>
  );
}

function ScenarioResultDisplay({ result, onClear }: { result: ScenarioResult; onClear: () => void }) {
  const likelihoodColor = result.likelihood >= 70 ? 'text-green-600' : result.likelihood >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Scenario Analysis Result
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Likelihood & Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
            <p className="text-xs text-muted-foreground mb-1">Likelihood</p>
            <p className={`text-4xl font-bold ${likelihoodColor}`}>{result.likelihood}%</p>
            <Progress value={result.likelihood} className="mt-2 h-2" />
          </div>
          <div className="text-center p-4 rounded-lg bg-white/60 dark:bg-gray-900/40">
            <p className="text-xs text-muted-foreground mb-1">Expected Timeline</p>
            <p className="text-lg font-semibold mt-2">{result.timeline}</p>
          </div>
        </div>

        {/* Analysis */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <Brain className="w-4 h-4 text-purple-500" /> Detailed Analysis
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{result.analysis}</p>
        </div>

        {/* Cascading Effects */}
        {result.cascading_effects?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4 text-amber-500" /> Cascading Effects
            </h4>
            <ul className="space-y-1">
              {result.cascading_effects.map((effect, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-3 h-3 mt-1 text-amber-400 flex-shrink-0" />
                  <span className="text-muted-foreground">{effect}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Actions */}
        {result.recommended_actions?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <Shield className="w-4 h-4 text-blue-500" /> Recommended Actions
            </h4>
            <ul className="space-y-1">
              {result.recommended_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-3 h-3 mt-1 text-blue-400 flex-shrink-0" />
                  <span className="text-muted-foreground">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Factors */}
        {result.risk_factors?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Key Risk Factors
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {result.risk_factors.map((factor, i) => (
                <Badge key={i} variant="destructive" className="text-xs font-normal">{factor}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Reasoning */}
        {result.confidence_reasoning && (
          <p className="text-xs text-muted-foreground italic border-t pt-3">
            {result.confidence_reasoning}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Forecasting() {
  const [productFilter, setProductFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const filters = useMemo(() => ({
    ...(productFilter !== 'all' ? { product: productFilter } : {}),
    ...(riskFilter !== 'all' ? { risk_level: riskFilter } : {}),
  }), [productFilter, riskFilter]);

  const { data: forecasts = [], isLoading, error } = useForecasts(filters);
  const generateMutation = useGenerateForecasts();

  // Stats
  const stats = useMemo(() => {
    if (!forecasts.length) return { total: 0, critical: 0, high: 0, avgConfidence: 0 };
    const critical = forecasts.filter(f => f.risk_level === 'critical').length;
    const high = forecasts.filter(f => f.risk_level === 'high').length;
    const avg = forecasts.reduce((sum, f) => sum + Number(f.confidence), 0) / forecasts.length;
    return { total: forecasts.length, critical, high, avgConfidence: Math.round(avg) };
  }, [forecasts]);

  // Group by product
  const grouped = useMemo(() => {
    const map = new Map<string, Forecast[]>();
    for (const f of forecasts) {
      const key = f.product || 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return map;
  }, [forecasts]);

  const handleGenerate = async () => {
    try {
      toast.info('Generating AI forecasts — this may take 30-60 seconds…');
      const result = await generateMutation.mutateAsync();
      toast.success(`Generated ${result.forecastsInserted} predictions from ${result.totalDataPointsAnalyzed} data points`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate forecasts');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE3] dark:from-gray-900 dark:to-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Sparkles className="w-7 h-7" />
              </div>
              AI Regulatory Forecasting
            </h1>
            <p className="text-muted-foreground mt-1">
              ML-powered predictions of regulatory changes with confidence scores and risk analysis
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {generateMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…</>
              : <><RefreshCw className="w-4 h-4 mr-2" /> Generate Forecasts</>
            }
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
            label="Active Predictions"
            value={stats.total}
            color="bg-indigo-100 dark:bg-indigo-900/30"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            label="Critical Risk"
            value={stats.critical}
            subtext="Needs immediate attention"
            color="bg-red-100 dark:bg-red-900/30"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
            label="High Risk"
            value={stats.high}
            subtext="Monitor closely"
            color="bg-orange-100 dark:bg-orange-900/30"
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-green-600" />}
            label="Avg Confidence"
            value={`${stats.avgConfidence}%`}
            subtext="Across all predictions"
            color="bg-green-100 dark:bg-green-900/30"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="predictions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Scale className="w-4 h-4" /> Predictions
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <Beaker className="w-4 h-4" /> What-If Scenarios
            </TabsTrigger>
          </TabsList>

          {/* ── Predictions Tab ──────────────────────────────────────── */}
          <TabsContent value="predictions" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Product" /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                <p className="text-muted-foreground mt-3">Loading predictions…</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Error loading forecasts</AlertTitle>
                <AlertDescription>
                  {(error as Error).message}. Click "Generate Forecasts" to create initial predictions.
                </AlertDescription>
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !error && forecasts.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Sparkles className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No predictions yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Click "Generate Forecasts" to analyze {'>'}1,700 regulatory data points and generate
                    AI-powered predictions with confidence scores and risk assessments.
                  </p>
                  <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                    {generateMutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…</>
                      : <><Sparkles className="w-4 h-4 mr-2" /> Generate First Predictions</>
                    }
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Forecast Cards — grouped by product */}
            {!isLoading && forecasts.length > 0 && (
              <div className="space-y-8">
                {Array.from(grouped.entries()).map(([product, items]) => (
                  <div key={product}>
                    <h3 className="text-lg font-semibold capitalize flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="text-sm">{product}</Badge>
                      <span className="text-sm text-muted-foreground font-normal">
                        {items.length} prediction{items.length !== 1 ? 's' : ''}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {items.map(f => <ForecastCard key={f.id} forecast={f} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Scenario Tab ─────────────────────────────────────────── */}
          <TabsContent value="scenarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-indigo-500" />
                  What-If Scenario Builder
                </CardTitle>
                <CardDescription>
                  Explore hypothetical regulatory changes and their potential impact on your business.
                  Our AI analyzes current regulatory data and historical patterns to assess each scenario.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScenarioBuilder />
              </CardContent>
            </Card>

            {/* Example scenarios */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">Example Scenarios to Try</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'What if the DEA reschedules cannabis to Schedule III?',
                    'What if New York bans all delta-8 THC products?',
                    'What if the FDA approves kratom as a dietary supplement?',
                    'What if California implements a flavor ban on nicotine vapes?',
                    'What if Oregon decriminalizes all psychedelics statewide?',
                    'What if the 2025 Farm Bill removes hemp THC limits?',
                  ].map((scenario, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-background border">
                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{scenario}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
