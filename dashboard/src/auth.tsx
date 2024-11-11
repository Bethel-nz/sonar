import { createContext, useContext, useCallback, useMemo, ReactNode, useEffect } from 'react';
import Cookies from 'js-cookie';
import ky from 'ky';

interface UserSession {
	user?: {
		id: string;
		email: string;
		username: string;
		createdAt: string;
	};
	lastChecked: number;
}

export interface AuthContext {
	isAuthenticated: boolean;
	user: UserSession['user'] | undefined;
	login: (email: string, password: string) => Promise<void>;
	signup: (value: { email: string; password: string; username: string }) => Promise<void>;
	logout: () => Promise<void>;
	checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContext | null>(null);
const USER_DATA_KEY = 'sonar_user_data';

const api = ky.create({
	prefixUrl: 'http://localhost:5390/api/v1',
	credentials: 'include',
});

function getStoredUserData(): UserSession['user'] | undefined {
	const stored = Cookies.get(USER_DATA_KEY);
	if (!stored) return undefined;
	try {
		return JSON.parse(stored) as UserSession['user'];
	} catch (e) {
		Cookies.remove(USER_DATA_KEY);
		return undefined;
	}
}

function setStoredUserData(user: UserSession['user']) {
	// Set cookie to expire in 7 days (same as refresh token)
	Cookies.set(USER_DATA_KEY, JSON.stringify(user), {
		expires: 7,
		sameSite: 'lax',
		secure: true,
	});
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const storedUser = getStoredUserData();
	const isAuthenticated = !!storedUser;

	const checkSession = useCallback(async () => {
		try {
			const response = await api.get('auth/me');
			const data: { status: string; user?: UserSession['user']; message?: string } =
				await response.json();

			if (response.status === 200 && data.status === 'active' && data.user) {
				setStoredUserData(data.user);
			} else {
				Cookies.remove(USER_DATA_KEY);
			}
		} catch (error) {
			console.error('Session check failed:', error);
			Cookies.remove(USER_DATA_KEY);
		}
	}, []);

	useEffect(() => {
		// Check session every 1 hour
		const interval = setInterval(checkSession, 60 * 60 * 1000);
		return () => clearInterval(interval);
	}, [checkSession]);

	const signup = useCallback(
		async (value: { email: string; password: string; username: string }) => {
			const formData = new FormData();
			formData.append('email', value.email);
			formData.append('password', value.password);
			formData.append('username', value.username);

			try {
				const response = await api.post('auth/signup', { body: formData });
				const data: { message?: string; user?: UserSession['user'] } = await response.json();

				if (response.status !== 201) {
					throw new Error(data.message || 'Signup failed');
				}

				if (data.user) {
					setStoredUserData(data.user);
				}
			} catch (error: any) {
				const errorMessage = error.response?.data?.error || error.message;
				console.error('Signup Error:', {
					message: errorMessage,
					status: error.response?.status,
				});
				throw new Error(errorMessage);
			}
		},
		[],
	);

	const login = useCallback(async (email: string, password: string) => {
		const formData = new FormData();
		formData.append('email', email);
		formData.append('password', password);

		try {
			const response = await api.post('auth/login', { body: formData });
			const data: { message?: string; error?: string; user?: UserSession['user'] } =
				await response.json();

			if (response.status !== 200) {
				throw new Error(data.error || 'Login failed');
			}

			if (data.user) {
				setStoredUserData(data.user);
			}
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || error.message;
			console.error('Login Error:', {
				message: errorMessage,
				status: error.response?.status,
				details: error.response?.data,
			});
			throw error;
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			const response = await api.post('auth/logout');
			const data: { message?: string; error?: string } = await response.json();

			if (response.status !== 200) {
				throw new Error(data.error || 'Logout failed');
			}

			Cookies.remove(USER_DATA_KEY);
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || error.message;
			console.error('Logout Error:', {
				message: errorMessage,
				status: error.response?.status,
				details: error.response?.data,
			});
			throw new Error(errorMessage);
		}
	}, []);

	const value = useMemo(
		() => ({
			isAuthenticated,
			user: storedUser,
			login,
			logout,
			signup,
			checkSession,
		}),
		[isAuthenticated, storedUser, login, logout, signup, checkSession],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
