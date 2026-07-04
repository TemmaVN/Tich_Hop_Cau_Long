/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    // ✅ Dùng state thay vì đọc localStorage trực tiếp
    const [userRole, setUserRole] = useState(() => {
        const raw = localStorage.getItem('userRole');
        if (!raw) return null;
        try { return JSON.parse(raw); } 
        catch { return null; }
    });

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await authApi.login(email, password);
            const token = response.data?.token;
            if (token) {
                const decodedUser = jwtDecode(token);
                localStorage.setItem('token', token);
                localStorage.setItem('userRole', JSON.stringify(decodedUser));
                setUserRole(decodedUser); // ✅ cập nhật state → trigger re-render
                return { success: true, user: decodedUser };
            }
            return { success: false, message: 'Login failed' };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
        finally {
            setLoading(false)
        }
    };

    const register = async (userData) => {
        setLoading(true);
        try {
            await authApi.register({ email: userData.email, password: userData.password});
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            return { success: false, message };
        }
        finally {
            setLoading(false)
        }
    }

    const logout = () => {
        setLoading(true);
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            setUserRole(null); // ✅ cập nhật state → trigger re-render
            return { success: true };
        } catch {
            return { success: false, message: 'Logout failed' };
        }
        finally {
            setLoading(false)
        }
    };

    const isAdmin = () => {
        if (!userRole) return false; // ✅ đọc từ state thay vì localStorage
        const roleData = userRole.role || userRole.roles;
        if (!roleData) return false;
        if (Array.isArray(roleData)) {
            return roleData.map(r => r.toLowerCase()).includes('admin');
        }
        return roleData.toLowerCase() === 'admin';
    };

    const value = {
        login,
        register,
        logout,
        isAdmin,
        isAuthenticated: !!userRole, // ✅ reactive theo state
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
