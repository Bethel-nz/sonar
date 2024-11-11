import * as React from 'react';
import { ErrorComponent, createFileRoute, useRouter } from '@tanstack/react-router';
import { useQueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query';
import { PostNotFoundError } from '~/lib/api';
import { postsQueryOptions } from '~/lib/queries/post';
import type { ErrorComponentProps } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/')({
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(postsQueryOptions),
	errorComponent: PostErrorComponent,
	component: HomeComponent,
});

export function PostErrorComponent({ error }: ErrorComponentProps) {
	const router = useRouter();
	const queryErrorResetBoundary = useQueryErrorResetBoundary();

	if (error instanceof PostNotFoundError) {
		return <div className='p-4 text-red-500'>{error.message}</div>;
	}

	React.useEffect(() => {
		queryErrorResetBoundary.reset();
	}, [queryErrorResetBoundary]);

	return (
		<div className='p-4'>
			<button
				onClick={() => {
					router.invalidate();
				}}
				className='px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-500'
			>
				Retry
			</button>
			<ErrorComponent error={error} />
		</div>
	);
}

function HomeComponent() {
	const { data: posts } = useSuspenseQuery(postsQueryOptions);

	return (
		<div className='p-6'>
			<h1 className='text-2xl font-bold mb-6'>Welcome to Dashboard</h1>
			<div className='grid gap-4'>
				{posts.map((post) => (
					<div key={post.id} className='p-4 border rounded-lg'>
						<h2 className='text-xl font-semibold'>{post.title}</h2>
						<p className='mt-2 text-gray-600'>{post.body}</p>
					</div>
				))}
			</div>
		</div>
	);
}
