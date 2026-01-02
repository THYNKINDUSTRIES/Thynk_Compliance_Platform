import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2, HardDrive, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cacheManager, getCacheStats, clearCache, CACHE_CONFIG } from '@/lib/cache';

interface CacheStats {
  hits: number;
  misses: number;
  totalEntries: number;
  totalSize: number;
  lastCleanup: number;
}

interface CacheStatusIndicatorProps {
  fromCache?: boolean;
  onRefresh?: () => void;
  showDetails?: boolean;
}

export const CacheStatusIndicator: React.FC<CacheStatusIndicatorProps> = ({
  fromCache = false,
  onRefresh,
  showDetails = true,
}) => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cacheStats = await getCacheStats();
        setStats(cacheStats);
      } catch (error) {
        console.warn('Failed to fetch cache stats:', error);
      }
    };

    fetchStats();
    
    // Refresh stats when popover opens
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearCache();
      const newStats = await getCacheStats();
      setStats(newStats);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const hitRate = stats && (stats.hits + stats.misses) > 0
    ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
    : 0;

  const cacheUsagePercent = stats
    ? Math.min((stats.totalSize / CACHE_CONFIG.MAX_CACHE_SIZE) * 100, 100)
    : 0;

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        {fromCache ? (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Zap className="w-3 h-3 mr-1" />
            Cached
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Database className="w-3 h-3 mr-1" />
            Live
          </Badge>
        )}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-7 px-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
        >
          {fromCache ? (
            <>
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">Cached</span>
            </>
          ) : (
            <>
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400">Live</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Cache Status
            </h4>
            <Badge variant={cacheManager.isUsingIndexedDB() ? 'default' : 'secondary'}>
              {cacheManager.isUsingIndexedDB() ? 'IndexedDB' : 'localStorage'}
            </Badge>
          </div>

          {stats && (
            <>
              {/* Hit Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Hit Rate</span>
                  <span className="font-medium">{hitRate}%</span>
                </div>
                <Progress value={hitRate} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stats.hits} hits</span>
                  <span>{stats.misses} misses</span>
                </div>
              </div>

              {/* Cache Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Storage Used</span>
                  <span className="font-medium">{formatBytes(stats.totalSize)}</span>
                </div>
                <Progress value={cacheUsagePercent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stats.totalEntries} entries</span>
                  <span>Max: {formatBytes(CACHE_CONFIG.MAX_CACHE_SIZE)}</span>
                </div>
              </div>

              {/* Last Cleanup */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last Cleanup
                </span>
                <span className="text-xs">{formatTime(stats.lastCleanup)}</span>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRefresh();
                  setIsOpen(false);
                }}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearCache}
              disabled={isClearing}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isClearing ? 'Clearing...' : 'Clear Cache'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Cache expires after {CACHE_CONFIG.DEFAULT_TTL / 60000} minutes. 
            Cached data loads instantly without API calls.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CacheStatusIndicator;
