# GitHub Token Setup Guide

## Method 1: Supabase Dashboard (Recommended)

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Access Edge Functions Settings**
   - Click on "Edge Functions" in the left sidebar
   - Click on "Manage secrets" or "Settings" button

3. **Add New Secret**
   - Click "Add new secret" or "New secret"
   - Name: `GITHUB_TOKEN`
   - Value: Paste your GitHub Personal Access Token
   - Click "Save" or "Add secret"

## Method 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Set the secret
supabase secrets set GITHUB_TOKEN=your_github_token_here
```

## Method 3: Environment Variables (Alternative)

If the above methods fail, add to your `.env` file:

```env
VITE_GITHUB_TOKEN=your_github_token_here
```

## Creating a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: "Supabase Deployment"
4. Expiration: Choose duration
5. Scopes: Select `repo` (full control of private repositories)
6. Click "Generate token"
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again)

## Troubleshooting "ERROR UPDATING SECRETS"

### Common Causes:

1. **Insufficient Permissions**
   - Ensure you're the project owner or have admin access
   - Check your Supabase organization role

2. **Project Not Linked**
   ```bash
   supabase projects list
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **CLI Not Authenticated**
   ```bash
   supabase logout
   supabase login
   ```

4. **Invalid Token Format**
   - Token should start with `ghp_` for personal access tokens
   - No spaces or quotes around the token value
   - No newlines or special characters

5. **Browser/Cache Issues**
   - Clear browser cache
   - Try incognito/private mode
   - Try different browser

## Verify Secret Was Added

```bash
# List all secrets (values are hidden)
supabase secrets list
```

## Using the Secret in Edge Functions

Once added, access it in your edge functions:

```typescript
const githubToken = Deno.env.get('GITHUB_TOKEN');

if (!githubToken) {
  throw new Error('GITHUB_TOKEN not configured');
}
```

## Security Best Practices

- Never commit tokens to Git
- Use tokens with minimal required permissions
- Rotate tokens regularly
- Use different tokens for dev/prod
- Set expiration dates on tokens

## Still Having Issues?

1. Check Supabase status: https://status.supabase.com
2. Try the Supabase CLI method instead of dashboard
3. Contact Supabase support with error details
4. Verify your account has billing enabled (some features require it)
