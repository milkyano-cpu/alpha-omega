This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## API Communication

The application uses axios for most API communications. The API client is set up in `lib/api-client.ts` and provides:

- Automatic token inclusion in requests
- Consistent error handling
- Type-safe response handling
- Automatic redirection to login page when token expires

For payment processing and booking-specific operations, the application uses the native fetch API to ensure compatibility with Square's payment processing system.

## Authentication & Token Management

The application handles authentication using JWT tokens with the following features:

- Automatic token expiration detection using jwt-decode
- User session preservation with localStorage
- Smart redirection to login with return URL support
- Periodic token validation to ensure session integrity

## Working with the API

To make API calls, import the API object from the api-client:

```typescript
import { API } from '@/lib/api-client';

// GET request example
const data = await API.get('/endpoint');

// POST request example
const response = await API.post('/endpoint', { key: 'value' });
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
