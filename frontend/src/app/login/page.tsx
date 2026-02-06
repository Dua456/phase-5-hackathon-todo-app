import dynamic from 'next/dynamic';

// Dynamically import the login page with SSR disabled
const DynamicLoginPage = dynamic(() => import('./LoginPageClient'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-900 flex items-center justify-center">Loading...</div>,
});

export default function LoginPage() {
  return <DynamicLoginPage />;
}