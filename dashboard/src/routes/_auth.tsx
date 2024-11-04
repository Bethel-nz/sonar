import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuth } from '~auth';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      const isAuthRoute = location.pathname.startsWith('/auth/');

      if (isAuthRoute) {
        return;
      }

      throw redirect({
        to: '/auth/login',
        // search: {
        //   redirect: location.pathname + location.search,
        // },
      });
    }

    if (context.auth.isAuthenticated && location.pathname.startsWith('/auth/')) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const auth = useAuth();

  return (
    <div>
      {auth.isAuthenticated && (

        <Outlet />
      )}
    </div>
  );
}
