import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api, { errText } from '../api';
import { useAuth } from '../AuthContext';
import { Avatar, Icon } from '../components/ui';
import { useToast } from '../components/Toast';
import PostCard from '../components/PostCard';
import Stories from '../components/Stories';

export default function Feed() {
  const { user, socket } = useAuth();
  const { refresh, tick } = useOutletContext();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef();
  const [tab, setTab] = useState('latest');
  const preview = file ? URL.createObjectURL(file) : '';
  const shown = tab === 'popular' ? [...posts].sort((a, b) => b.likes.length - a.likes.length) : posts;

  useEffect(() => { api.get('/posts/feed').then(r => setPosts(r.data)); }, []);
  useEffect(() => { api.get('/friends').then(r => setFriends(r.data)); }, [tick]);

  // Real-time events from the server
  useEffect(() => {
    if (!socket) return;
    const onPost = (p) => setPosts(prev => prev.some(x => x._id === p._id) ? prev : [p, ...prev]);
    const onLike = (d) => setPosts(prev => prev.map(p => p._id === d.postId ? { ...p, likes: d.likes } : p));
    const onComment = (d) => setPosts(prev => prev.map(p => p._id === d.postId ? { ...p, commentCount: d.commentCount } : p));
    socket.on('post:new', onPost); socket.on('post:like', onLike); socket.on('comment:new', onComment);
    return () => { socket.off('post:new', onPost); socket.off('post:like', onLike); socket.off('comment:new', onComment); };
  }, [socket]);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('text', text);
    if (file) fd.append('media', file);
    try {
      const { data } = await api.post('/posts', fd);
      setPosts(prev => prev.some(x => x._id === data._id) ? prev : [data, ...prev]);
      setText(''); setFile(null); fileRef.current.value = ''; refresh(); toast('Posted');
    } catch (er) { toast(errText(er)); }
  };
  const remove = async (id) => { await api.delete('/posts/' + id); setPosts(p => p.filter(x => x._id !== id)); refresh(); };

  return (
    <>
      <Stories friends={friends} tick={tick} />
      <div className="fhead"><h3 className="h">News Feed</h3>
        <div className="tabs">
          <button className={tab === 'latest' ? 'on' : ''} onClick={() => setTab('latest')}>Latest</button>
          <button className={tab === 'popular' ? 'on' : ''} onClick={() => setTab('popular')}>Popular</button>
        </div>
      </div>
      <form className="composer" onSubmit={submit}>
        <div className="row">
          <Avatar user={user} />
          <textarea rows="2" placeholder="Share something" value={text} onChange={e => setText(e.target.value)} />
        </div>
        {preview && (file.type.startsWith('video') ? <video className="pmedia" src={preview} controls /> : <img className="pmedia" src={preview} alt="" />)}
        <div className="row">
          <label className="filebtn"><Icon n="image" size={18} /> Photo or video
            <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={e => setFile(e.target.files[0] || null)} />
          </label>
          <span className="grow" />
          <button className="btn">Send</button>
        </div>
      </form>
      {posts.length === 0 && (
        <div className="empty"><p>Your feed is empty.</p><Link className="btn cta" to="/friends">Find friends</Link></div>
      )}
      {shown.map(p => <PostCard key={p._id} post={p} onDelete={remove} />)}
    </>
  );
}
