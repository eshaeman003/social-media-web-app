import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import PostCard from '../components/PostCard';
import useLive from '../components/useLive';

export default function Videos() {
  const [posts, setPosts] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { api.get('/posts/feed', { params: { type: 'video' } }).then(r => { setPosts(r.data); setReady(true); }); }, []);
  useLive(setPosts);
  const remove = async (id) => { await api.delete('/posts/' + id); setPosts(p => p.filter(x => x._id !== id)); };

  return (
    <>
      <h3 className="h">Videos</h3>
      <p className="muted small">Videos from you, your friends and public profiles.</p>
      {ready && posts.length === 0 && (
        <div className="empty"><p>No videos yet. Post one from your feed with the Photo or video button.</p><Link className="btn cta" to="/">Go to feed</Link></div>
      )}
      {posts.map(p => <PostCard key={p._id} post={p} onDelete={remove} />)}
    </>
  );
}
