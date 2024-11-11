import ky from 'ky';

export const api = ky.create({
	prefixUrl: process.env.API_URL,
	credentials: 'include',
});

export class ProjectNotFoundError extends Error {}
export class WorkflowNotFoundError extends Error {}


export interface Post {
	id: number;
	title: string;
	body: string;
	userId: number;
}

export class PostNotFoundError extends Error {}



export const fetchPost = async (postId: string) => {
	try {
		const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);

		if (!response.ok) {
			if (response.status === 404) {
				throw new PostNotFoundError(`Post with id "${postId}" not found!`);
			}
			throw new Error('Failed to fetch post');
		}

		return response.json() as Promise<Post>;
	} catch (error) {
		if (error instanceof PostNotFoundError) throw error;
		throw new Error('Failed to fetch post');
	}
};

export const fetchPosts = async () => {
	console.info('Fetching posts...');
	const response = await fetch('https://jsonplaceholder.typicode.com/posts');
	if (!response.ok) throw new Error('Failed to fetch posts');
	const posts = (await response.json()) as Post[];
	return posts.slice(0, 10);
};


