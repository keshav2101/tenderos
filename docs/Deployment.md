# TenderOS Production Deployment Guide

Guide for deploying TenderOS to cloud platforms (Railway & Vercel) or self-hosted Docker environments.

## Cloud Deployment

### Railway (Backend Infrastructure & Microservices)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Link project: `railway link`
3. Configure Environment Variables in Railway dashboard:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `QDRANT_HOST`, `QDRANT_API_KEY`
   - `GEMINI_API_KEY`
4. Deploy: `railway up --detach`

### Vercel (Frontend App)

1. Deploy using Vercel CLI:
   ```bash
   cd apps/frontend
   vercel --prod
   ```
2. Set Environment Variable in Vercel UI:
   - `NEXT_PUBLIC_API_URL`: URL of your Railway API Gateway.

## Self-Hosted Docker Deployment

```bash
cp .env.production.template .env
docker compose -f docker-compose.prod.yml up -d
```
