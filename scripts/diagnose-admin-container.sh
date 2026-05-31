#!/usr/bin/env bash
# diagnose-admin-container.sh — read-only checks for elevate-admin ECS + live endpoints.
# Requires: aws CLI (configured), curl, optional gh CLI for recent deploy runs.
set -euo pipefail

CLUSTER="${ECS_CLUSTER:-elevate-cluster}"
SERVICE="${ECS_SERVICE:-elevate-admin-service}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
ADMIN_URL="${ADMIN_URL:-https://admin.elevateforhumanity.org}"

echo "=== Elevate Admin container diagnostic ==="
echo "Cluster: $CLUSTER  Service: $SERVICE  Region: $REGION"
echo ""

echo "--- Live HTTP probes ---"
for path in /api/ping /api/health /login; do
  code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 15 "${ADMIN_URL}${path}" 2>/dev/null || echo "000")
  echo "  ${ADMIN_URL}${path} → HTTP $code"
done
echo ""

if ! aws sts get-caller-identity --region "$REGION" &>/dev/null; then
  echo "AWS CLI not configured — skipping ECS/CloudWatch (run with credentials for full report)."
  exit 0
fi

echo "--- ECS service ---"
aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$SERVICE" \
  --region "$REGION" \
  --query 'services[0].{status:status,taskDef:taskDefinition,running:runningCount,desired:desiredCount,pending:pendingCount,deployments:deployments[*].{status:status,taskDef:taskDefinition,rollout:rolloutState,running:runningCount,failed:failedTasks}}' \
  --output json

echo ""
echo "--- Recent service events ---"
aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$SERVICE" \
  --region "$REGION" \
  --query 'services[0].events[0:12].[createdAt,message]' \
  --output table

echo ""
echo "--- Tasks (running + recently stopped) ---"
RUNNING=$(aws ecs list-tasks --cluster "$CLUSTER" --service-name "$SERVICE" --desired-status RUNNING --region "$REGION" --query 'taskArns[]' --output text 2>/dev/null || true)
STOPPED=$(aws ecs list-tasks --cluster "$CLUSTER" --service-name "$SERVICE" --desired-status STOPPED --region "$REGION" --query 'taskArns[]' --output text 2>/dev/null || true)
TASKS=$(echo "$RUNNING $STOPPED" | xargs 2>/dev/null || true)
if [ -n "$TASKS" ]; then
  aws ecs describe-tasks \
    --cluster "$CLUSTER" \
    --tasks $TASKS \
    --region "$REGION" \
    --query 'tasks[].{arn:taskArn,last:lastStatus,health:healthStatus,stop:stoppedReason,exit:containers[0].exitCode,image:containers[0].image}' \
    --output table
else
  echo "  (no tasks found)"
fi

echo ""
echo "--- CloudWatch (last 30 log lines, newest stream) ---"
LOG_GROUP="/ecs/elevate-admin"
STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --region "$REGION" \
  --query 'logStreams[0].logStreamName' \
  --output text 2>/dev/null || echo "")
if [ -n "$STREAM" ] && [ "$STREAM" != "None" ]; then
  echo "  Stream: $STREAM"
  aws logs get-log-events \
    --log-group-name "$LOG_GROUP" \
    --log-stream-name "$STREAM" \
    --limit 30 \
    --region "$REGION" \
    --query 'events[].message' \
    --output text 2>/dev/null | tail -30
else
  echo "  (no log streams)"
fi

echo ""
echo "--- Task definition env (SITE_URL / ADMIN_URL) ---"
TD=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --region "$REGION" --query 'services[0].taskDefinition' --output text)
aws ecs describe-task-definition --task-definition "$TD" --region "$REGION" \
  --query 'taskDefinition.containerDefinitions[0].environment[?name==`NEXT_PUBLIC_SITE_URL` || name==`NEXT_PUBLIC_ADMIN_URL` || name==`NEXT_PUBLIC_PUBLIC_SITE_URL` || name==`SERVICE_ROLE`]' \
  --output table 2>/dev/null || true

echo ""
echo "Done. For GitHub deploy history: gh run list --workflow=deploy-admin.yml --limit 5"
