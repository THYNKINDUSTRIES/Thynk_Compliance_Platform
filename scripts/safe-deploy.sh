#!/bin/bash
# =============================================================================
# Thynk Compliance Platform - Safe Deployment Script
# 
# Features:
#   1. Tags the current version before deploying
#   2. Deploys all edge functions
#   3. Supports rollback to last known-good version
#   4. Health check after deployment
# 
# Usage:
#   ./scripts/safe-deploy.sh deploy     # Tag + deploy everything
#   ./scripts/safe-deploy.sh rollback   # Rollback to last tagged version  
#   ./scripts/safe-deploy.sh functions  # Deploy only edge functions
#   ./scripts/safe-deploy.sh tag        # Just tag current version
#   ./scripts/safe-deploy.sh status     # Show deployment status
# =============================================================================

set -euo pipefail

SUPABASE_PROJECT_REF="kruwbjaszdwzttblxqwr"
SUPABASE_URL="https://${SUPABASE_PROJECT_REF}.supabase.co"
DEPLOY_TAG_PREFIX="deploy"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Tag current version ───────────────────────────────────────────────
tag_version() {
  cd "$PROJECT_DIR"
  local timestamp=$(date +%Y%m%d-%H%M%S)
  local commit=$(git rev-parse --short HEAD)
  local tag="${DEPLOY_TAG_PREFIX}-${timestamp}-${commit}"
  
  # Ensure working tree is clean (warn if dirty)
  if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    log_warn "Working tree has uncommitted changes"
    log_info "Committing changes before tagging..."
    git add -A
    git commit -m "Auto-commit before deployment ${timestamp}" || true
  fi
  
  git tag -a "$tag" -m "Deployment ${timestamp} from commit ${commit}"
  log_ok "Tagged: $tag"
  echo "$tag"
}

# ── Get last deployment tag ───────────────────────────────────────────
get_last_tag() {
  git tag -l "${DEPLOY_TAG_PREFIX}-*" --sort=-creatordate | head -1
}

get_previous_tag() {
  git tag -l "${DEPLOY_TAG_PREFIX}-*" --sort=-creatordate | sed -n '2p'
}

# ── Deploy edge functions ─────────────────────────────────────────────
deploy_functions() {
  cd "$PROJECT_DIR"
  local functions=(
    "caselaw-poller"
    "cannabis-hemp-poller"
    "congress-poller"
    "federal-register-poller"
    "kava-poller"
    "kratom-poller"
    "regulations-gov-poller"
    "rss-feed-poller"
    "scheduled-poller-cron"
    "send-contact-email"
    "site-monitor"
    "state-legislature-poller"
    "state-regulations-poller"
    "nlp-analyzer"
  )
  
  local success=0
  local failed=0
  
  for fn in "${functions[@]}"; do
    if [ -d "supabase/functions/$fn" ]; then
      log_info "Deploying: $fn"
      if supabase functions deploy "$fn" --no-verify-jwt 2>/dev/null; then
        log_ok "Deployed: $fn"
        ((success++))
      else
        log_error "Failed: $fn"
        ((failed++))
      fi
    else
      log_warn "Skipping $fn (directory not found)"
    fi
  done
  
  log_info "Functions deployed: $success success, $failed failed"
  return $failed
}

# ── Health check ──────────────────────────────────────────────────────
health_check() {
  log_info "Running health check..."
  
  # Check site-monitor
  local response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${SUPABASE_URL}/functions/v1/site-monitor" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-}" \
    -H "Content-Type: application/json" \
    -d '{"heal": false}' \
    --max-time 30 2>/dev/null || echo "000")
  
  if [ "$response" == "200" ]; then
    log_ok "Site monitor: healthy"
  else
    log_warn "Site monitor returned: $response"
  fi
  
  # Check frontend
  local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "https://www.thynkflow.io" --max-time 10 2>/dev/null || echo "000")
  if [ "$frontend_status" == "200" ]; then
    log_ok "Frontend: healthy ($frontend_status)"
  else
    log_warn "Frontend returned: $frontend_status"
  fi
}

# ── Rollback ──────────────────────────────────────────────────────────
rollback() {
  cd "$PROJECT_DIR"
  local previous_tag=$(get_previous_tag)
  
  if [ -z "$previous_tag" ]; then
    log_error "No previous deployment tag found. Cannot rollback."
    exit 1
  fi
  
  log_warn "Rolling back to: $previous_tag"
  log_info "Current HEAD: $(git rev-parse --short HEAD)"
  log_info "Target: $(git rev-parse --short "$previous_tag")"
  
  # Create a rollback branch
  local rollback_branch="rollback-$(date +%Y%m%d-%H%M%S)"
  git checkout -b "$rollback_branch" "$previous_tag"
  
  log_info "Redeploying edge functions from $previous_tag..."
  deploy_functions
  
  log_info "Building frontend from $previous_tag..."
  npm run build 2>/dev/null && log_ok "Frontend built" || log_error "Frontend build failed"
  
  log_ok "Rollback complete to $previous_tag on branch $rollback_branch"
  log_info "To push this rollback: git push origin $rollback_branch"
  log_info "To merge back to main: git checkout main && git merge $rollback_branch"
}

# ── Status ────────────────────────────────────────────────────────────
show_status() {
  cd "$PROJECT_DIR"
  
  echo ""
  log_info "=== Deployment Status ==="
  echo ""
  
  local current_tag=$(get_last_tag)
  local prev_tag=$(get_previous_tag)
  
  echo "Current Branch: $(git branch --show-current)"
  echo "Current Commit: $(git rev-parse --short HEAD) - $(git log --oneline -1)"
  echo ""
  echo "Last Deploy Tag: ${current_tag:-none}"
  echo "Previous Tag:    ${prev_tag:-none}"
  echo ""
  
  echo "Recent deployment tags:"
  git tag -l "${DEPLOY_TAG_PREFIX}-*" --sort=-creatordate | head -5 | while read tag; do
    echo "  $tag ($(git log --oneline -1 "$tag" 2>/dev/null || echo 'unknown'))"
  done
  
  echo ""
  health_check
}

# ── Full Deploy ───────────────────────────────────────────────────────
full_deploy() {
  log_info "=== Starting Full Deployment ==="
  
  # 1. Tag the current version
  local tag=$(tag_version)
  
  # 2. Push tag to remote
  log_info "Pushing tag to remote..."
  git push origin "$tag" 2>/dev/null && log_ok "Tag pushed" || log_warn "Tag push failed (manual push needed)"
  
  # 3. Deploy edge functions
  deploy_functions
  
  # 4. Build frontend
  log_info "Building frontend..."
  cd "$PROJECT_DIR"
  npm run build 2>/dev/null && log_ok "Frontend built" || log_error "Frontend build failed"
  
  # 5. Health check
  health_check
  
  echo ""
  log_ok "=== Deployment Complete: $tag ==="
  log_info "To rollback: ./scripts/safe-deploy.sh rollback"
}

# ── Main ──────────────────────────────────────────────────────────────
case "${1:-help}" in
  deploy)    full_deploy ;;
  rollback)  rollback ;;
  functions) tag_version > /dev/null; deploy_functions ;;
  tag)       tag_version ;;
  status)    show_status ;;
  *)
    echo "Usage: $0 {deploy|rollback|functions|tag|status}"
    echo ""
    echo "  deploy    - Tag version, deploy functions, build frontend"
    echo "  rollback  - Rollback to previous tagged version"
    echo "  functions - Deploy only edge functions"
    echo "  tag       - Tag current version without deploying"
    echo "  status    - Show current deployment status"
    ;;
esac
