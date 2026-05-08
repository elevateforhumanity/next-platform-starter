# AWS ECS Deployment Checklist

One-time setup. Takes about 1-2 hours in the AWS Console.
Everything in `aws/` is already written — you just run the commands.

---

## Step 1 — AWS Console setup (you do this)

### 1a. Create ECR repositories
Go to: AWS Console → ECR → Create repository

Create two repositories:
- `elevate-lms`
- `elevate-admin`

### 1b. Create ECS Cluster
Go to: AWS Console → ECS → Clusters → Create Cluster
- Name: `elevate-cluster`
- Infrastructure: AWS Fargate

### 1c. Create IAM Roles
Go to: AWS Console → IAM → Roles → Create Role

**ecsTaskExecutionRole** (already exists in most accounts — check first)
- Attach policy: `AmazonECSTaskExecutionRolePolicy`
- Attach policy: `AmazonSSMReadOnlyAccess` (for secrets)

**ecsTaskRole**
- Attach policy: `CloudWatchLogsFullAccess`

### 1d. Create SSM Parameters (your env vars)
Go to: AWS Console → Systems Manager → Parameter Store

Create one parameter per env var. Use type `SecureString`.
Name format: `/elevate/VARIABLE_NAME`

Required parameters (copy values from your .env.local):
```
/elevate/NEXT_PUBLIC_SUPABASE_URL
/elevate/NEXT_PUBLIC_SUPABASE_ANON_KEY
/elevate/SUPABASE_SERVICE_ROLE_KEY
/elevate/NEXT_PUBLIC_SITE_URL
/elevate/STRIPE_SECRET_KEY
/elevate/STRIPE_WEBHOOK_SECRET
/elevate/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
/elevate/OPENAI_API_KEY
/elevate/SENDGRID_API_KEY
/elevate/CRON_SECRET
/elevate/UPSTASH_REDIS_REST_URL
/elevate/UPSTASH_REDIS_REST_TOKEN
/elevate/CLOUDFLARE_ACCOUNT_ID
/elevate/CLOUDFLARE_R2_ACCESS_KEY_ID
/elevate/CLOUDFLARE_R2_SECRET_ACCESS_KEY
```

### 1e. Create Application Load Balancers
Go to: AWS Console → EC2 → Load Balancers → Create

Create two ALBs:
- `elevate-lms-alb` — port 443, target group port 3000
- `elevate-admin-alb` — port 443, target group port 3000

Note the DNS names — update `aws/cloudfront.json` with them.

### 1f. Create ECS Services
Go to: AWS Console → ECS → elevate-cluster → Create Service

**LMS Service:**
- Launch type: Fargate
- Task definition: elevate-lms (register from aws/ecs-task-lms.json)
- Service name: elevate-lms-service
- Desired tasks: 1 (scale up later)
- Load balancer: elevate-lms-alb

**Admin Service:**
- Launch type: Fargate
- Task definition: elevate-admin (register from aws/ecs-task-admin.json)
- Service name: elevate-admin-service
- Desired tasks: 1
- Load balancer: elevate-admin-alb

### 1g. Request SSL Certificate
Go to: AWS Console → ACM → Request Certificate
- Domain: `elevateforhumanity.org`
- Add name: `*.elevateforhumanity.org`
- Validation: DNS (add the CNAME to Cloudflare)

Update `aws/cloudfront.json` with the certificate ARN.

### 1h. Create CloudFront Distribution (public LMS/web only)
Go to: AWS Console → CloudFront → Create Distribution
Use settings from `aws/cloudfront.json`.

### 1i. Update DNS in Cloudflare/Route53
Add CNAMEs pointing to your CloudFront distribution domain:
- `www.elevateforhumanity.org` → CloudFront
- `elevateforhumanity.org` → CloudFront (or A alias if Route53)

Admin domain must be direct and separate:
- `admin.elevateforhumanity.org` → CNAME to the admin ALB DNS name

CloudFront distribution should include only public aliases.
Admin TLS certificate must be attached to the **admin ALB HTTPS (443) listener**.
Do not use raw `*.elb.amazonaws.com` URLs as public entrypoints.

---

## Step 2 — GitHub Secrets (you do this)

Go to: GitHub → elevateforhumanity/Elevate-lms → Settings → Secrets → Actions

Add these secrets:
```
AWS_ACCESS_KEY_ID        ← new key you create (not the exposed one)
AWS_SECRET_ACCESS_KEY    ← new secret
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
CRON_SECRET
```

---

## Step 3 — First deploy (automatic)

Once GitHub secrets are set, push any commit to main.
The workflow in `.github/workflows/deploy-aws.yml` will:
1. Build both Docker images
2. Push to ECR
3. Deploy to ECS
4. Wait for health checks to pass

Watch progress: GitHub → Actions tab.

---

## Step 4 — Verify

```bash
# LMS health check
curl https://www.elevateforhumanity.org/api/health

# Admin health check  
curl https://admin.elevateforhumanity.org/admin
```

---

## Step 5 — Enable cron job

Uncomment the `schedule:` block in `.github/workflows/deploy-aws.yml`:
```yaml
on:
  schedule:
    - cron: '0 14 * * *'   # 09:00 ET daily
```

---

## Memory allocation

Current config: 4 vCPU / 16GB RAM per service.
If video rendering still needs more, update `aws/ecs-task-lms.json`:
- `"cpu": "8192"` (8 vCPU)
- `"memory": "30720"` (30GB)

No code changes needed — just update the task definition and redeploy.

---

## Cost estimate

| Resource | Monthly |
|---|---|
| ECS Fargate (2 services, 4vCPU/16GB) | ~$120 |
| ALB (2) | ~$35 |
| CloudFront | ~$5-20 |
| ECR storage | ~$5 |
| CloudWatch logs | ~$5 |
| **Total** | **~$165-185/mo** |

Scale desired tasks to 0 when not in use to save cost.
