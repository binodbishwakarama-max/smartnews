
# Smart News Frontend

Modern, accessible, and high-performance news web app built with Next.js 16, TypeScript, and Tailwind CSS.

## Features
- AI-powered news feed and recommendations
- Responsive, mobile-first design
- Dark mode and theme toggle
- Bookmarking and user authentication
- Robust error handling and offline-friendly UI
- Accessibility (a11y) best practices
- Dynamic imports for performance

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

## Development

- Edit pages in `app/` and components in `components/`.
- Uses [Tailwind CSS](https://tailwindcss.com/) for styling.
- Context providers for theme, bookmarks, and auth in `contexts/`.

## Testing

This project uses [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit and integration tests.

To run tests:

```bash
npm test
# or
npx jest
```

Test files are in `__tests__/` and follow the pattern `*.test.tsx`.

## Accessibility

- All interactive elements have accessible labels or roles.
- Images use descriptive `alt` text.
- Keyboard navigation and focus states are supported.

## Contribution

1. Fork the repo and create a feature branch.
2. Run `npm install` and `npm run dev` to start local development.
3. Add or update tests for your changes.
4. Open a pull request with a clear description.

## License

MIT

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
