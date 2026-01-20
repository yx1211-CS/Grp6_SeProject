import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // 确保这一行路径正确
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 1. 监听 Supabase 的 Auth 状态变化
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user); // 如果有 Session，设置用户
            } else {
                setUser(null); // 没有 Session，用户为空
            }
        });

        // 2. 清理监听器
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const setAuth = (authUser) => {
        setUser(authUser);
    };

    const setUserData = (userData) => {
        setUser(prevUser => ({
            ...prevUser, // 保留原有的 id, email 等 Auth 信息
            ...userData  // 混入数据库的 username, bio, accountid 等信息
        }));
    }

    return (
        <AuthContext.Provider value={{ user, setAuth, setUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);