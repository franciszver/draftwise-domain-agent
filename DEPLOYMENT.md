# Deployment Guide

This guide explains how to deploy the DraftWise Domain Agent application to AWS Amplify Hosting for online access.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Git Repository** (GitHub, GitLab, Bitbucket, or CodeCommit)
3. **AWS CLI** configured with your credentials
4. **Node.js** and npm installed locally

## Deployment Options

### Option 1: Git-Based Deployment (Recommended)

This is the easiest and most automated approach. Amplify will automatically deploy when you push to your repository.

#### Step 1: Push Code to Git Repository

```powershell
# Make sure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Connect Repository to Amplify Hosting

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Choose your Git provider (GitHub, GitLab, Bitbucket, or CodeCommit)
4. Authorize and select your repository
5. Select the branch (usually `main` or `master`)

#### Step 3: Configure Build Settings

Amplify should auto-detect the build settings, but verify:

- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Base directory**: (leave empty)

#### Step 4: Configure Environment Variables (if needed)

If your app needs environment variables, add them in the Amplify Console:
- Go to **App settings** → **Environment variables**
- Add any required variables

#### Step 5: Deploy Backend First

Before the frontend can work, you need to deploy the backend:

```powershell
# Set your AWS profile
$env:AWS_PROFILE = "default4"
$env:AWS_REGION = "us-west-2"

# Deploy backend to production
npx ampx pipeline-deploy --profile default4
```

This will:
- Deploy all Lambda functions, AppSync API, DynamoDB tables, etc.
- Generate `amplify_outputs.json` in your repository
- Set up all AWS resources

#### Step 6: Add Secrets to Parameter Store

After backend deployment, add your API keys:

```powershell
# Set environment variables with your API keys
$env:OPENAI_API_KEY = "your-openai-key"
$env:BRAVE_API_KEY = "your-brave-key"
$env:JINA_API_KEY = "your-jina-key"
$env:OPENROUTER_API_KEY = "your-openrouter-key"

# Run the setup script (it will auto-detect app ID)
.\scripts\setup-secrets.ps1
```

#### Step 7: Commit amplify_outputs.json

After backend deployment, commit the generated `amplify_outputs.json`:

```powershell
git add amplify_outputs.json
git commit -m "Add amplify_outputs.json for production"
git push origin main
```

Amplify will automatically trigger a new build and deploy.

#### Step 8: Access Your App

Once deployment completes, Amplify will provide you with:
- **Production URL**: `https://<branch>.<app-id>.amplifyapp.com`
- **Custom Domain**: (optional, can be configured later)

---

### Option 2: Manual Deployment via CLI

If you prefer more control or want to deploy without Git:

#### Step 1: Deploy Backend

```powershell
$env:AWS_PROFILE = "default4"
$env:AWS_REGION = "us-west-2"

# Deploy backend
npx ampx pipeline-deploy --profile default4
```

#### Step 2: Build Frontend

```powershell
npm run build
```

#### Step 3: Deploy to Amplify Hosting

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Deploy without Git"**
3. Upload the `dist` folder contents
4. Configure build settings (same as Option 1)

#### Step 4: Add Secrets

Same as Option 1, Step 6.

---

## Post-Deployment Checklist

- [ ] Backend deployed successfully (`npx ampx pipeline-deploy`)
- [ ] All API keys added to Parameter Store
- [ ] `amplify_outputs.json` committed to repository (for Git-based deployment)
- [ ] Frontend build completes without errors
- [ ] App is accessible via Amplify URL
- [ ] Test document creation works
- [ ] Test domain configuration works
- [ ] Test suggestions generation works

## Troubleshooting

### Build Fails

- Check that `amplify_outputs.json` exists in the repository
- Verify all dependencies are in `package.json`
- Check build logs in Amplify Console

### Backend Not Working

- Verify secrets are in Parameter Store: `/amplify/shared/<app-id>/`
- Check Lambda function logs in CloudWatch
- Verify AppSync API is deployed

### Frontend Can't Connect to Backend

- Ensure `amplify_outputs.json` is properly loaded
- Check browser console for errors
- Verify CORS settings in AppSync

## Custom Domain Setup

1. Go to **App settings** → **Domain management**
2. Click **"Add domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (can take up to 1 hour)

## Environment-Specific Deployments

You can set up multiple environments (staging, production):

1. Create separate branches: `main` (production), `staging` (staging)
2. Connect both branches in Amplify Console
3. Each branch will get its own URL and backend resources

## Cost Considerations

- **Amplify Hosting**: Free tier includes 15 GB storage and 5 GB served per month
- **Lambda**: Pay per request (very cheap for low traffic)
- **DynamoDB**: Free tier includes 25 GB storage and 25 RCU/WCU
- **AppSync**: $4 per million queries
- **S3**: Pay for storage and requests

For a small application, expect costs under $10/month.

## Security Notes

- Never commit `amplify_outputs.json` with sensitive data (it's already in `.gitignore`)
- Use AWS Secrets Manager for API keys (already configured)
- Enable CloudWatch logging for monitoring
- Set up CloudTrail for audit logging
