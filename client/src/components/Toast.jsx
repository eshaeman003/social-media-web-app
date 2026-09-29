import { createContext, useCallback, useContext, useState } from 'react';
const T = createContext(() => {});
export const useToast = () => useContext(T);

export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((msg) => {
    const id = Math.random();
    setList(l => [...l, { id, msg }]);
    setTimeout(() => setList(l => l.filter(t => t.id !== id)), 3500);
  }, []);
  return <T.Provider value={push}>{children}<div className="toasts">{list.map(t => <div key={t.id} className="toast">{t.msg}</div>)}</div></T.Provider>;
}
