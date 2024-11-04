
import { createRootRouteWithContext } from '@tanstack/react-router'

import type { AuthContext } from '~auth'
import View from '~layout/view'

interface MyRouterContext {
  auth: AuthContext
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: View
})
