import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import PostCard from '../components/PostCard';
import useLive from '../components/useLive';

export default function Saved() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { api.get('/posts/saved').then(r => { setPosts(r.data); setReady(true); }); }, []);
  useLive(setPosts);
  const remove = async (id) => { await api.delete('/posts/' + id); setPosts(p => p.filter(x => x._id !== id)); };
  const shown = posts.filter(p => (user.saved || []).includes(p._id)); // unsaving removes it instantly

  return (
    <>
      <h3 className="h">Saved posts</h3>
      {ready && shown.length === 0 && <div className="empty"><p>Nothing saved yet. Tap the bookmark on any post to keep it here.</p></div>}
      {shown.map(p => <PostCard key={p._id} post={p} onDelete={remove} />)}
    </>
  );
}
