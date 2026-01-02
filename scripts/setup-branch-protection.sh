#!/bin/bash

# =============================================================================
# Branch Protection Setup Script
# =============================================================================
# This script configures branch protection rules using GitHub CLI
# Prerequisites: gh cli installed and authenticated
# =============================================================================

set -e

# Configuration
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
MAIN_BRANCH="main"
DEVELOP_BRANCH="develop"

echo "🔒 Setting up branch protection for: $REPO"
echo "=================================================="

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "   Run: gh auth login"
    exit 1
fi

# =============================================================================
# Main Branch Protection
# =============================================================================
echo ""
echo "📌 Configuring protection for '$MAIN_BRANCH' branch..."

gh api "repos/$REPO/branches/$MAIN_BRANCH/protection" \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  --input - << EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint", "build", "test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "required_linear_history": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
EOF

if [ $? -eq 0 ]; then
    echo "✅ Main branch protection configured successfully!"
else
    echo "❌ Failed to configure main branch protection"
    exit 1
fi

# =============================================================================
# Develop Branch Protection
# =============================================================================
echo ""
echo "📌 Configuring protection for '$DEVELOP_BRANCH' branch..."

# First check if develop branch exists
if gh api "repos/$REPO/branches/$DEVELOP_BRANCH" &> /dev/null; then
    gh api "repos/$REPO/branches/$DEVELOP_BRANCH/protection" \
      -X PUT \
      -H "Accept: application/vnd.github+json" \
      --input - << EOF
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["lint", "build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Develop branch protection configured successfully!"
    else
        echo "⚠️  Failed to configure develop branch protection"
    fi
else
    echo "⚠️  Develop branch does not exist yet. Skipping..."
    echo "   Create it with: git checkout -b develop && git push -u origin develop"
fi

# =============================================================================
# Verify Configuration
# =============================================================================
echo ""
echo "🔍 Verifying branch protection..."
echo ""

echo "Main branch protection:"
gh api "repos/$REPO/branches/$MAIN_BRANCH/protection" \
  --jq '{
    required_status_checks: .required_status_checks.contexts,
    required_reviews: .required_pull_request_reviews.required_approving_review_count,
    dismiss_stale: .required_pull_request_reviews.dismiss_stale_reviews,
    enforce_admins: .enforce_admins.enabled,
    linear_history: .required_linear_history.enabled
  }' 2>/dev/null || echo "  (not configured)"

echo ""
echo "=================================================="
echo "✅ Branch protection setup complete!"
echo ""
echo "📋 Required GitHub Secrets for CI:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - SUPABASE_ACCESS_TOKEN"
echo "   - SUPABASE_PROJECT_REF"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo ""
echo "🔗 Configure secrets at:"
echo "   https://github.com/$REPO/settings/secrets/actions"
