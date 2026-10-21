# Ntorichambers

Use the Company profile for Context and use the logo appropriately.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ntorichambers.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5892fd39-9771-43b1-8d94-33c7d793a337).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Admin authentication

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in your local `.env` file and deployment environment to enable `/admin` sign-in. `VITE_SUPABASE_ANON_KEY` is also accepted for existing projects. Use only a publishable or anon key, never a service-role or secret key. Create admin accounts through the Supabase dashboard; public sign-up is not enabled by this interface.
