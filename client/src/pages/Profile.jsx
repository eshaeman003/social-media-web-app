import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import api, { errText, media } from '../api';
import { Avatar } from '../components/ui';
import { useToast } from '../components/Toast';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { id } = useParams();
  const { refresh } = useOutletContext();
  const toast = useToast();
  const [p, setP] = useState(null);
  const load = () => api.get('/users/' + id).then(r => setP(r.data)).catch(e => setP({ error: errText(e) }));
  useEffect(() => { setP(null); load(); }, [id]);

  if (!p) return <p className="muted center">Loading…</p>;
  if (p.error) return <p className="error center">{p.error}</p>;

  const add = async () => { try { await api.post('/friends/request/' + id); toast('Friend request sent'); load(); } catch (e) { toast(errText(e)); } };
  const unfriend = async () => { await api.delete('/friends/' + id); load(); refresh(); };
  const del = async (pid) => { await api.delete('/posts/' + pid); load(); refresh(); };

  return (
    <>
      <section className="pcover">
        <div className="cover" style={p.cover ? { backgroundImage: `url(${media(p.cover)})` } : undefined} />
        <div className="pinfo">
          <Avatar user={p} size={96} ring />
          <div className="grow">
            <h2>{p.name}</h2>
            {!p.locked && <p className="muted">{p.bio || 'No bio yet.'}</p>}
            {!p.locked && <p className="small"><b>{p.posts.length}</b> posts · <b>{p.friendCount}</b> friends</p>}
          </div>
          <div>
            {p.relation === 'none' && <button className="btn cta" onClick={add}>Add friend</button>}
            {p.relation === 'sent' && <span className="muted">Request sent</span>}
            {p.relation === 'received' && <Link className="btn" to="/friends">Respond</Link>}
            {p.relation === 'friends' && <><Link className="btn" to={'/chat/' + id}>Message</Link> <button className="btn ghost" onClick={unfriend}>Unfriend</button></>}
            {p.relation === 'self' && <Link className="btn ghost" to="/settings">Edit profile</Link>}
          </div>
        </div>
      </section>
      {p.locked
        ? <div className="empty"><p>This profile is visible to friends only. Send a friend request to see their posts.</p></div>
        : <>{p.posts.length === 0 && <div className="empty"><p>No posts yet.</p></div>}
            {p.posts.map(x => <PostCard key={x._id} post={x} onDelete={del} />)}</>}
    </>
  );
}
