import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import api, { errText } from './api';
import { useAuth } from './AuthContext';
import { Avatar, Icon, ago } from './components/ui';
import { useToast } from './components/Toast';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Settings from './pages/Settings';
import Videos from './pages/Videos';
import Saved from './pages/Saved';
import Chat from './pages/Chat';

const label = { like: 'liked your post', comment: 'commented on your post', friend_request: 'sent you a friend request', friend_accepted: 'accepted your friend request' };

function Shell() {
  const { user, socket, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [me, setMe] = useState(null);
  const [reqs, setReqs] = useState([]);
  const [sug, setSug] = useState([]);
  const [chatUnread, setChatUnread] = useState(0);
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const refresh = () => setTick(t => t + 1);
  const unread = notes.filter(n => !n.read).length;
  const recent = (me?.posts || []).slice(0, 7).reverse();
  const max = Math.max(1, ...recent.map(p => p.likes.length));
  const likes = (me?.posts || []).reduce((a, p) => a + p.likes.length, 0);

  useEffect(() => {
    api.get('/users/' + user._id).then(r => setMe(r.data));
    api.get('/friends/requests').then(r => setReqs(r.data));
    api.get('/chat/conversations').then(r => setChatUnread(r.data.reduce((a, c) => a + c.unread, 0)));
    api.get('/users/suggestions').then(r => setSug(r.data)).catch(() => setSug([]));
  }, [tick, user._id]);
  useEffect(() => { api.get('/notifications').then(r => setNotes(r.data)); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNote = (n) => { setNotes(p => [n, ...p]); toast(`${n.from.name} ${label[n.type]}`); refresh(); };
    const onMsg = (m) => { if (String(m.to) === user._id) { if (!window.location.pathname.startsWith('/chat/' + m.from)) toast('New message'); refresh(); } };
    socket.on('notification', onNote); socket.on('message:new', onMsg);
    return () => { socket.off('notification', onNote); socket.off('message:new', onMsg); };
  }, [socket]);

  const respond = async (id, action) => { await api.put(`/friends/requests/${id}/${action}`); refresh(); };
  const add = async (id) => {
    try { await api.post('/friends/request/' + id); toast('Friend request sent'); setSug(s => s.filter(u => u._id !== id)); } catch (e) { toast(errText(e)); }
  };
  const bell = async () => {
    setOpen(!open);
    if (!open && unread) { await api.put('/notifications/read-all'); setTimeout(() => setNotes(p => p.map(n => ({ ...n, read: true }))), 1500); }
  };
  const search = (e) => { e.preventDefault(); if (q.trim()) navigate('/friends?q=' + encodeURIComponent(q.trim())); };

  return (
    <div className="app">
      <header className="hdr card">
        <Link to="/" className="logo">Circle</Link>
        <form className="search" onSubmit={search}><Icon n="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people" /></form>
        <div className="hicons">
          <Link to="/" className="hbtn" title="New post" aria-label="New post"><Icon n="plus" /></Link>
          <Link to="/chat" className="hbtn" aria-label="Messages"><Icon n="comment" />{chatUnread > 0 && <i className="count">{chatUnread}</i>}</Link>
          <div className="bellwrap">
            <button className="hbtn" onClick={bell} aria-label="Notifications"><Icon n="bell" />{unread > 0 && <i className="count">{unread}</i>}</button>
            {open && (
              <div className="drop">
                {notes.length === 0 && <p className="muted pad">No notifications yet.</p>}
                {notes.map(n => (
                  <Link key={n._id} to={'/profile/' + n.from._id} onClick={() => setOpen(false)} className={'note' + (n.read ? '' : ' new')}>
                    <Avatar user={n.from} size={34} />
                    <span><b>{n.from.name}</b> {label[n.type]}<br /><small className="muted">{ago(n.createdAt)}</small></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to={'/profile/' + user._id} className="profchip"><Avatar user={user} size={32} /><span>{user.name.split(' ')[0]}</span></Link>
        </div>
      </header>

      <div className="cols">
        <aside className="side">
          <div className="card">
            <Link to={'/profile/' + user._id} className="me">
              <Avatar user={user} size={46} />
              <div className="grow"><b className="clip">{user.name}</b><div className="small muted clip">{user.email}</div></div>
            </Link>
            <nav className="nav">
              <NavLink to="/" end><Icon n="home" /> <span>News Feed</span></NavLink>
              <NavLink to="/friends"><Icon n="users" /> <span>Friends</span>{reqs.length > 0 && <i className="count">{reqs.length}</i>}</NavLink>
              <NavLink to="/chat"><Icon n="comment" /> <span>Chat</span>{chatUnread > 0 && <i className="count">{chatUnread}</i>}</NavLink>
              <NavLink to="/videos"><Icon n="video" /> <span>Videos</span></NavLink>
              <NavLink to="/saved"><Icon n="bookmark" /> <span>Saved</span></NavLink>
              <NavLink to={'/profile/' + user._id}><Icon n="user" /> <span>Profile</span></NavLink>
              <NavLink to="/settings"><Icon n="sliders" /> <span>Settings</span></NavLink>
              <button className="navbtn" onClick={logout}><Icon n="out" /> <span>Logout</span></button>
            </nav>
          </div>
        </aside>

        <main className="main"><Outlet context={{ refresh, tick }} /></main>

        <aside className="rail">
          <section className="card">
            <h4 className="ctitle">Your insights</h4>
            <div className="stat3"><div><b>{me?.posts?.length ?? 0}</b><span>Posts</span></div><div><b>{likes}</b><span>Likes</span></div><div><b>{me?.friendCount ?? 0}</b><span>Friends</span></div></div>
            {recent.length > 0
              ? <><div className="bars2">{recent.map(p => <div key={p._id} className="bar" title={p.likes.length + ' likes'}><i style={{ height: Math.max(6, (p.likes.length / max) * 100) + '%' }} /></div>)}</div><p className="small muted">Likes on your last {recent.length} posts</p></>
              : <p className="small muted">Post something to see your likes here.</p>}
          </section>
          <section className="card">
            <h4 className="ctitle">Friend requests {reqs.length > 0 && <i className="count">{reqs.length}</i>}</h4>
            {reqs.length === 0 && <p className="muted small">No pending requests.</p>}
            {reqs.map(r => (
              <div key={r._id} className="rrow">
                <Avatar user={r.from} size={38} />
                <div className="grow"><Link to={'/profile/' + r.from._id} className="name">{r.from.name}</Link>
                  <div className="small"><button className="txt blue" onClick={() => respond(r._id, 'accept')}>Accept</button> <button className="txt" onClick={() => respond(r._id, 'reject')}>Decline</button></div></div>
              </div>
            ))}
          </section>
          <section className="card">
            <h4 className="ctitle">Suggestions for you <Link to="/friends" className="small seeall">See all</Link></h4>
            {sug.length === 0 && <p className="muted small">No suggestions right now.</p>}
            {sug.map(u => (
              <div key={u._id} className="rrow">
                <Avatar user={u} size={40} />
                <div className="grow"><Link to={'/profile/' + u._id} className="name">{u.name}</Link><div className="small muted clip">{u.mutual > 0 ? `${u.mutual} mutual friends` : (u.bio || 'New on Circle')}</div></div>
                <button className="btn sm" onClick={() => add(u._id)}>Add</button>
              </div>
            ))}
          </section>
          <section className="card">
            <h4 className="ctitle">Recent activity</h4>
            {notes.length === 0 && <p className="muted small">Likes, comments and requests will show up here.</p>}
            {notes.slice(0, 4).map(n => (
              <div key={n._id} className="rrow"><Avatar user={n.from} size={34} /><span className="small"><b>{n.from.name}</b> {label[n.type]}<br /><span className="muted">{ago(n.createdAt)}</span></span></div>
            ))}
          </section>
          <p className="foot muted small">About · Help · Privacy · Terms<br />© 2026 Circle</p>
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!user) return <Routes><Route path="*" element={<Auth />} /></Routes>;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Feed />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
