import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

// Routes that should not have the header/footer layout
const authRoutes = ['/login', '/signup'];

function RootLayout() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isAuthRoute = authRoutes.includes(pathname);
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAdminRoute = pathname.startsWith('/admin');

  // Auth routes, dashboard routes, and admin routes handle their own layout
  if (isAuthRoute || isDashboardRoute || isAdminRoute) {
    return (
      <>
        <ImpersonationBanner />
        <Outlet />
      </>
    );
  }

  return (
    <>
      <ImpersonationBanner />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
