import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    // Enable CORS for local development
    cors: true,
    // Proxy API requests to avoid CORS issues in development
    proxy: {
      '/api': {
        target: 'https://kruwbjaszdwzttblxqwr.supabase.co',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    host: "localhost",
    port: 4173,
    strictPort: true,
    // HTTPS for preview mode
    https: true,
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Build optimizations for production
  build: {
    target: 'es2020',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-select', '@radix-ui/react-tooltip', '@radix-ui/react-popover'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          'export-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
          'export-excel': ['exceljs', 'xlsx'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  // Define environment variables
  define: {
    __BETA_MODE__: JSON.stringify(true),
    __ALLOWED_EMAIL_DOMAIN__: JSON.stringify('@thynk.guru'),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    // Preview mode requires authentication
    __PREVIEW_AUTH_REQUIRED__: JSON.stringify(mode === 'preview' || process.env.VITE_PREVIEW_MODE === 'true'),
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
  },
  // Environment directory
  envDir: '.',
  envPrefix: 'VITE_',
}));
