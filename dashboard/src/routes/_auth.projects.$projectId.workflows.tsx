import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/projects/$projectId/workflows')({
	beforeLoad: ({ params, location }) => {
		// This regex matches exactly /projects/<id>/workflows
		const isExactWorkflowsPath = /^\/projects\/[^/]+\/workflows$/.test(location.pathname);

		if (isExactWorkflowsPath) {
			throw redirect({
				to: '/projects/$projectId',
				params: { projectId: params.projectId },
			})
		}
	},
	component: () => <Outlet />
})

