<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4d81f86d-8dc7-4edc-ae92-f0b8cb5bf981

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy automatico na Vercel

O workflow `.github/workflows/deploy-vercel.yml` publica em producao a cada push nas branches `main` ou `master`, e tambem pode ser executado manualmente pelo GitHub Actions.

Configure este secret no repositorio GitHub:

- `VERCEL_TOKEN`

Configure tambem estas variaveis no projeto da Vercel:

- `SUPABASE_SERVICE_ROLE_KEY`
- `MP_ENCRYPTION_KEY`
- `APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE`
