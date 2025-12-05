# Deployment Guide - Render.com

This guide explains how to deploy the Torsion Rings Generator to production on Render.com.

## Prerequisites

- GitHub account with the repository pushed
- Render.com account (free tier available)
- gfortran compiler available on Render (included in default environment)

## Deployment Steps

### 1. Push Your Code to GitHub

```bash
cd /Users/esguerra/development/fortranweb
git add .
git commit -m "Production ready: torsion rings visualization with PNG/PDF output"
git push origin main
```

### 2. Create Render.com Account

1. Go to https://render.com
2. Sign up with GitHub (recommended - auto-connects your repos)
3. Connect your GitHub account

### 3. Create a New Web Service

1. Click "New +" button → Select "Web Service"
2. Select your `fortranweb` repository
3. Configure the service:

   **Basic Settings:**
   - **Name**: `torsion-rings` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     npm install && cd client && npm install && npm run build && cd .. && cd fortran && gfortran-mp-14 -o pdb_torsion pdb_torsion.f90 || gfortran -o pdb_torsion pdb_torsion.f90 || true && cd ../..
     ```
   - **Start Command**: 
     ```
     npm start
     ```

   **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001
   ```

   **Plan**: Free tier (or Starter if free is full)

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Run the build command
   - Compile Fortran code
   - Install dependencies
   - Start the server
3. You'll get a URL like `https://torsion-rings.onrender.com`

### 5. Automatic Deployments

- Every time you push to `main` branch, Render automatically redeploys
- Monitor deployment logs in Render dashboard
- Rollback to previous deployments if needed

## Important Notes for Production

### Python Environment
- The app uses Python for matplotlib visualization
- Render's default image includes Python 3.x
- Update the server code to use system Python if needed:
  ```javascript
  // In server/index.js, change:
  `/Users/esguerra/miniforge3/envs/pubchempy/bin/python3`
  // To:
  `python3`
  ```

### Temporary Files
- Uploads are stored in `/tmp` on Render (ephemeral - cleaned up regularly)
- This is fine for a stateless web service
- Generated PNG/PDF files are sent to client, not persisted

### Performance
- Free tier has limitations (sleep after 15 mins of inactivity, max 750 hrs/month)
- For production use with high traffic, upgrade to Starter ($7/month)

### Scaling
- Free tier: 1 vCPU, 512MB RAM
- Suitable for small to medium workloads
- Upgrade to Starter plan for better performance

## Troubleshooting

### Build Fails with Fortran Error
- Render may not have `gfortran-mp-14`
- Use `gfortran` instead (standard package)
- Update build command to try both versions

### Python Module Not Found
- Ensure you update the Python path in `server/index.js`
- Change from miniforge path to system `python3`
- Test locally first: `which python3` and verify matplotlib is available

### Service Won't Start
- Check build logs in Render dashboard
- Verify all dependencies are in `package.json`
- Ensure Python 3 and matplotlib are available

## Custom Domain

To use a custom domain:

1. In Render dashboard → Service Settings
2. Add custom domain under "Custom Domains"
3. Update DNS records as instructed by Render

## Local Testing Before Deployment

Test the build locally to catch issues early:

```bash
# Test build command locally
npm install && cd client && npm install && npm run build && cd ..

# Test start command
npm start
```

## Rollback

If something breaks after deployment:

1. Go to Render dashboard
2. Go to service → Deploys
3. Select previous deployment
4. Click "Redeploy"

## Support

- Render.com docs: https://render.com/docs
- For issues with the app itself, check server logs in Render dashboard

