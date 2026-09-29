import { useState } from 'react';
import api, { errText } from '../api';
import { useAuth } from '../AuthContext';

export default function Auth() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try { const { data } = await api.post('/auth/' + mode, f); login(data.token, data.user); }
    catch (er) { setErr(errText(er)); }
  };

  return (
    <div className="auth">
      <div className="hero">
        <h1><span className="hash">#</span>MEET<br />YOUR<br />CIRCLE</h1>
        <span className="free">Free to join</span>
      </div>
      <form className="sheet" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        {mode === 'register' && <input className="inp" placeholder="Full name" value={f.name} onChange={set('name')} required />}
        <input className="inp" type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className="inp" type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
        {err && <p className="error">{err}</p>}
        <button className="btn blue big">{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <button type="button" className="txt" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
