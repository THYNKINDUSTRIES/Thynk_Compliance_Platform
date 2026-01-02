# Federal Register Poller Fix

## Issue
The `federal-register-poller` edge function returns a 500 error because it fails when the request body is empty.

## Quick Fix - Deploy via Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Find `federal-register-poller` and click **Edit**
3. Find this line (around line 90):
   ```typescript
   const { sessionId, sourceName } = await req.json();
   ```

4. **Replace it with:**
   ```typescript
   let sessionId: string | undefined;
   let sourceName: string | undefined;
   
   try {
     const body = await req.text();
     if (body && body.trim()) {
       const parsed = JSON.parse(body);
       sessionId = parsed.sessionId;
       sourceName = parsed.sourceName;
     }
   } catch (e) {
     // Body is empty or not valid JSON - continue without session tracking
   }
   ```

5. Click **Deploy**

## Testing
```bash
curl -X POST https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/federal-register-poller \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `{"success": true, "recordsProcessed": ...}`
