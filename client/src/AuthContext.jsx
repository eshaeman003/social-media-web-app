import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api, { API } from './api';

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false);
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  // Open the WebSocket connection once we know who the user is
  useEffect(() => {
    if (!user) return;
    const s = io(API, { auth: { token: localStorage.getItem('token') } });
    setSocket(s);
    return () => s.disconnect();
  }, [user?._id]);

  const login = (token, u) => { localStorage.setItem('token', token); setUser(u); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); setSocket(null); };

  return <Ctx.Provider value={{ user, setUser, socket, login, logout, loading }}>{children}</Ctx.Provider>;
}
