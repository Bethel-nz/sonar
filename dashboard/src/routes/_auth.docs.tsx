import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/docs')({
  component: RouteComponent,
})

function RouteComponent() {
  return 'Hello /_auth/docs!'
}
