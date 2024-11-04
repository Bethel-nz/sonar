import { useState, createContext, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';
import Cookies from 'js-cookie';
import ky from 'ky';

export interface AuthContext {
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (value:{ email: string, username: string, password: string }) => Promise<void>;
	logout: () => Promise<void>;
	user: User | null;
}

interface User {
	id: string;
	email: string;
	username: string;
}

const AuthContext = createContext<AuthContext | null>(null);

const USER_KEY = 'sonar.user';

function getStoredUser(): User | null {
	const userStr = Cookies.get(USER_KEY);
	if (!userStr) return null;
	try {
		return JSON.parse(userStr) as User;
	} catch {
		return null;
	}
}

function setStoredUser(user: User | null) {
	if (user) {
		Cookies.set(USER_KEY, JSON.stringify(user));
	} else {
		Cookies.remove(USER_KEY);
		Cookies.remove('sonar_token');
		Cookies.remove('sonar_refresh_token');
	}
}

const api = ky.create({
	prefixUrl: 'http://localhost:5390/api/v1',
	credentials: 'include'
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(getStoredUser());
	const isAuthenticated = !!user && !!Cookies.get('sonar_token');

	const login = useCallback(async (email: string, password: string) => {
		const formData = new FormData();
		formData.append('email', email);
		formData.append('password', password);

		const response = await api.post('auth/login', {
			body: formData
		}).json<{ user: User }>();

		setStoredUser(response.user);
		setUser(response.user);
	}, []);

	const signup = useCallback(async (value:{email: string, username: string, password: string}) => {
		const formData = new FormData();
		formData.append('email', value.email);
		formData.append('username', value.username);
		formData.append('password', value.password);

		const response = await api.post('auth/signup', {
			body: formData
		}).json<{ user: User }>();

		setStoredUser(response.user);
		setUser(response.user);
	}, []);

	const logout = useCallback(async () => {
		try {
			await api.post('auth/logout');
		} finally {
			setStoredUser(null);
			setUser(null);
		}
	}, []);

	useEffect(() => {
		setUser(getStoredUser());
	}, []);

	const value = useMemo(() => ({
		isAuthenticated,
		user,
		login,
		logout,
		signup
	}), [isAuthenticated, user, login, logout, signup]);

	return (
		<>
			<AuthContext.Provider value={value}>
				{children}
			</AuthContext.Provider>
		</>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

export const projectApi = {
	create: async (name: string) => {
		const formData = new FormData();
		formData.append('name', name);
		return api.post('projects', { body: formData }).json();
	},

	update: async (projectId: string, name: string) => {
		const formData = new FormData();
		formData.append('name', name);
		return api.put(`projects/${projectId}`, { body: formData }).json();
	},

	updateWorkflowName: async (projectId: string, workflowId: string, name: string) => {
		const formData = new FormData();
		formData.append('name', name);
		return api.put(`projects/${projectId}/workflows/${workflowId}`, { body: formData }).json();
	}
}; 