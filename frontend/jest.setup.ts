import React from 'react';
import '@testing-library/jest-dom';

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useAuth: () => ({
    isLoaded: true,
    userId: null,
    getToken: jest.fn().mockResolvedValue('test-token'),
    signOut: jest.fn(),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      username: 'tester',
      firstName: 'Test',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: {},
      unsafeMetadata: {},
    },
  }),
  SignIn: () => React.createElement('div', null, 'SignIn'),
  SignUp: () => React.createElement('div', null, 'SignUp'),
  SignInButton: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  SignedIn: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  SignedOut: () => null,
  UserButton: () => React.createElement('div', null, 'UserButton'),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

global.fetch = jest.fn(async () => ({
  ok: true,
  json: async () => ([]),
})) as jest.Mock;

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});
