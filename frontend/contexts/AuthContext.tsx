'use client';
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { registerTokenGetter } from '../lib/api';

interface User {
    username: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    logout: () => void;
    isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { isLoaded, userId, getToken, signOut } = useClerkAuth();
    const { user: clerkUser } = useUser();

    useEffect(() => {
        if (isLoaded) {
            registerTokenGetter(() => getToken());
        }
    }, [getToken, isLoaded]);

    const logout = () => signOut();

    const user = clerkUser ? {
        username: clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || 'user'
    } : null;

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!userId,
            logout,
            isLoaded
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
