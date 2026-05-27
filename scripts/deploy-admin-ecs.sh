#!/usr/bin/env bash
# deploy-admin-ecs.sh
#
# Manually deploy the latest elevate-admin ECR image to ECS without triggering
# a full CodeBuild. Useful for hotfixes and rollbacks.
#
# Usage:
#   ./scripts/deploy-admin-ecs.sh                    # deploy :latest
#   ./scripts/deploy-admin-ecs.sh <image-tag>        # deploy specific tag
#   ./scripts/deploy-admin-ecs.sh --rollback         # redeploy current task def
#
# Requirements: aws CLI configured with ECS/ECR/IAM permissions.

set -euo pipefail

CLUSTER="elevate-cluster"
SERVICE="elevate-admin-service"
TASK_FAMILY="elevate-admin"
REPO_NAME="elevate-admin"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}"

TAG="${1:-latest}"
ROLLBACK=false
if [[ "${TAG}" == "--rollback" ]]; then
  ROLLBACK=true
fi

echo "=== Elevate Admin ECS Deploy ==="
echo "  Cluster:  ${CLUSTER}"
echo "  Service:  ${SERVICE}"
echo "  Region:   ${REGION}"

if [[ "${ROLLBACK}" == "true" ]]; then
  echo "  Mode:     ROLLBACK (force-new-deployment on current task def)"
  aws ecs update-service \
    --cluster "${CLUSTER}" \
    --service "${SERVICE}" \
    --force-new-deployment \
    --region "${REGION}" \
    --query 'service.taskDefinition' \
    --output text
  echo "Rollback deployment triggered."
  exit 0
fi

echo "  Image:    ${IMAGE_URI}:${TAG}"

# Verify image exists in ECR
echo ""
echo "Verifying image in ECR..."
aws ecr describe-images \
  --repository-name "${REPO_NAME}" \
  --image-ids "imageTag=${TAG}" \
  --region "${REGION}" \
  --query 'imageDetails[0].imagePushedAt' \
  --output text

# Get current task definition
echo ""
echo "Fetching current task definition..."
CURRENT_TD=$(aws ecs describe-task-definition \
  --task-definition "${TASK_FAMILY}" \
  --region "${REGION}" \
  --query 'taskDefinition' \
  --output json)

# Update image in task definition
NEW_TD=$(echo "${CURRENT_TD}" | python3 -c "
import json, sys
t = json.load(sys.stdin)
t['containerDefinitions'][0]['image'] = '${IMAGE_URI}:${TAG}'
for f in ['taskDefinitionArn','revision','status','requiresAttributes','compatibilities','registeredAt','registeredBy']:
    t.pop(f, None)
print(json.dumps(t))
")

# Register new task definition
echo "Registering new task definition..."
NEW_TD_ARN=$(aws ecs register-task-definition \
  --region "${REGION}" \
  --cli-input-json "${NEW_TD}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)
echo "  Registered: ${NEW_TD_ARN}"

# Update service
echo ""
echo "Updating ECS service..."
aws ecs update-service \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --task-definition "${NEW_TD_ARN}" \
  --region "${REGION}" \
  --query 'service.taskDefinition' \
  --output text

echo ""
echo "Deploy triggered. Monitor with:"
echo "  aws ecs describe-services --cluster ${CLUSTER} --services ${SERVICE} --query 'services[0].deployments'"
