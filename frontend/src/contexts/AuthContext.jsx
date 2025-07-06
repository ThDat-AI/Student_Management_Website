// contexts/AuthContext.jsx
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api';
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_ROLE } from '../constants/index';

const AuthContext = createContext(null);

const getInitialUser = () => {
    try {
        const user = localStorage.getItem('user_info');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem(ACCESS_TOKEN));
    const [user, setUser] = useState(getInitialUser());
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.clear();
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        window.location.replace('/login'); // Dùng replace để không thể back lại
    }, []);

    useEffect(() => {
        // Chỉ chạy một lần để xác thực lại token nếu có
        const verifyExistingToken = async () => {
            if (token && !user) { // Chỉ fetch user nếu có token mà chưa có user info
                try {
                    const res = await api.get('/api/accounts/me/');
                    const userData = res.data;
                    const role = userData?.MaVaiTro?.MaVaiTro;

                    // Lưu thông tin đơn giản vào context và localStorage
                    const simplifiedUser = { id: userData.id, Ten: userData.Ten, Ho: userData.Ho, role: role };
                    setUser(simplifiedUser);
                    localStorage.setItem('user_info', JSON.stringify(simplifiedUser));
                    localStorage.setItem(USER_ROLE, role);
                } catch (error) {
                    console.error("Token cũ không hợp lệ, đang đăng xuất.");
                    logout();
                }
            }
            setLoading(false);
        };
        verifyExistingToken();
    }, []); // Dependency rỗng đảm bảo chỉ chạy một lần khi app mount


    const login = useCallback((userData, accessToken, refreshToken) => {
        // userData là object user nhận được từ API đăng nhập
        // có dạng { id, Ho, Ten, role: "BGH", ... }
        const role = userData.role;

        const simplifiedUser = {
            id: userData.id,
            Ho: userData.Ho,
            Ten: userData.Ten,
            role: role
        };

        localStorage.setItem(ACCESS_TOKEN, accessToken);
        localStorage.setItem(REFRESH_TOKEN, refreshToken);
        localStorage.setItem(USER_ROLE, role);
        localStorage.setItem('user_info', JSON.stringify(simplifiedUser));

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        setToken(accessToken);
        setUser(simplifiedUser);
    }, []);

    const value = { user, token, loading, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};