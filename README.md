# CLIP on Vercel + HuggingFace (Free)

## Quick Start

### 1. Get HuggingFace Token
- Go to https://huggingface.co/settings/tokens
- Create a new **User Access Token** (read permission is fine)
- Copy the token

### 2. Setup Locally
```bash
npm install
export HUGGINGFACE_API_KEY="hf_your_token_here"
npm run dev
```
Visit http://localhost:3000

### 3. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
- When prompted, add `HUGGINGFACE_API_KEY` environment variable in Vercel dashboard
- Or set it during deployment:
```bash
vercel env add HUGGINGFACE_API_KEY
```

### 4. Done
Your app is live at `https://your-project.vercel.app`

## How It Works
- Frontend: Next.js React app on Vercel (free tier)
- Backend: Next.js API route → HuggingFace Inference API
- Model: OpenAI CLIP ViT-Base (runs on HuggingFace servers)
- Cost: $0 (both have free tiers)

## Limits
- HuggingFace free tier: ~30 requests/minute
- Vercel free tier: unlimited function calls (on Hobby plan)
- Each inference takes 1-3 seconds

## Test Image URL
```
https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/image-classification-task.png
```

Try labels: `dog, cat, bird`
