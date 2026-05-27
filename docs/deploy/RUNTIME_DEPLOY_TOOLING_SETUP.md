# Runtime Deploy Tooling Setup

How to configure the deploy toolchain for Elevate LMS on a new machine or CI environment.

## Prerequisites

- AWS CLI v2 (`brew install awscli` or https://aws.amazon.com/cli/)
- Docker with buildx (`docker buildx version`)
- Python 3 (for task definition patching in buildspecs)
- Node 20+ and pnpm 10+

## AWS credentials

Configure with the deploy IAM user (not root):

```bash
aws configure
# AWS Access Key ID: <from SSM or 1Password>
# AWS Secret Access Key: <from SSM or 1Password>
# Default region: us-east-1
# Default output format: json
```

Required IAM permissions:
- `ecr:GetAuthorizationToken`, `ecr:BatchGetImage`, `ecr:PutImage`
- `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, `ecs:DescribeServices`
- `ssm:GetParameter`, `ssm:GetParametersByPath`
- `sts:GetCallerIdentity`

## Validate setup

```bash
./scripts/setup-deploy-runtime.sh
```

This checks AWS credentials, Docker, ECR repos, ECS clusters, and required SSM parameters.

## Manual deploy (without CodeBuild)

**Admin:**
```bash
./scripts/deploy-admin-ecs.sh                  # deploy :latest
./scripts/deploy-admin-ecs.sh <tag>            # deploy specific image tag
./scripts/deploy-admin-ecs.sh --rollback       # re-deploy current task def
```

**LMS** — use the same pattern via AWS CLI directly or trigger a CodeBuild run:
```bash
aws codebuild start-build --project-name elevate-lms-build
```

## S3 source override (when GitHub push is unavailable)

```bash
# Package source
cd /path/to/Elevate-lms
git archive --format=zip HEAD -o /tmp/elevate-source.zip

# Upload
aws s3 cp /tmp/elevate-source.zip s3://elevate-codebuild-source-954718262498/source.zip

# Start build
aws codebuild start-build \
  --project-name elevate-lms-build \
  --source-type-override S3 \
  --source-location-override elevate-codebuild-source-954718262498/source.zip
```

## Environment variables

All secrets are stored in SSM Parameter Store under `/elevate/`. The buildspecs
fetch them at build time and bake `NEXT_PUBLIC_*` vars into the Docker image.

To add a new secret:
```bash
aws ssm put-parameter \
  --name "/elevate/MY_NEW_SECRET" \
  --value "the-value" \
  --type SecureString \
  --overwrite
```

Then add the corresponding `export` line to `aws/buildspec-lms.yml` and/or
`aws/buildspec-admin.yml` in the `pre_build` phase.

## CodeBuild projects

| Project | Builds | Deploys to |
|---|---|---|
| `elevate-lms-build` | LMS Next.js app | `elevate-lms-service` |
| `elevate-admin-build` | Admin Next.js app | `elevate-admin-service` |

Both projects are in `us-east-1`. Source is GitHub (`elevateforhumanity/Elevate-lms`, `main` branch)
or S3 override (see above).
