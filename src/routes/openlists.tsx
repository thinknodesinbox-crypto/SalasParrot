import { Navigate, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router';

const DEFAULT_OPEN_LIST_PATH = '/openlists/african-angel-investors-family-offices';

export const Route = createFileRoute('/openlists')({
  component: OpenListsRoute,
});

function OpenListsRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname === '/openlists' || pathname === '/openlists/') {
    return <Navigate to={DEFAULT_OPEN_LIST_PATH} replace />;
  }

  return <Outlet />;
}
