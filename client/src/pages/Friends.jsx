import { useEffect, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import api, { errText, media } from '../api';
import { Avatar } from '../components/ui';
import { useToast } from '../components/Toast';

export default function Friends() {
  const { refresh, tick } = useOutletContext();
  const toast = useToast();
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const [friends, setFriends] = useState([]);
  const [res, setRes] = useState(null);
  const [sug, setSug] = useState([]);

  useEffect(() => { api.get('/friends').then(r => setFriends(r.data)); }, [tick]);
  useEffect(() => { api.get('/users/suggestions', { params: { limit: 12 } }).then(r => setSug(r.data)).catch(() => {}); }, [tick]);
  useEffect(() => {
    if (!q) return setRes(null);
    api.get('/users/search', { params: { q } }).then(r => setRes(r.data));
  }, [q]);

  const add = async (id) => { try { await api.post('/friends/request/' + id); toast('Friend request sent'); } catch (e) { toast(errText(e)); } };
  const Card = ({ u, action }) => (
    <div className="pcard"><Avatar user={u} size={64} /><Link className="name" to={'/profile/' + u._id}>{u.name}</Link>{action}</div>
  );

  return (
    <>
      {res && (
        <>
          <h3 className="h">Results for “{q}”</h3>
          {res.length === 0 && <div className="empty"><p>No one found with that name.</p></div>}
          <div className="people">{res.map(u => <Card key={u._id} u={u} action={<button className="btn sm" onClick={() => add(u._id)}>Add friend</button>} />)}</div>
        </>
      )}
      {sug.length > 0 && (
        <>
          <h3 className="h">People you may know</h3>
          <div className="people">
            {sug.map(u => (
              <div key={u._id} className="pcard rich">
                <div className="mini" style={u.cover ? { backgroundImage: `url(${media(u.cover)})` } : undefined} />
                <Avatar user={u} size={60} ring />
                <Link className="name" to={'/profile/' + u._id}>{u.name}</Link>
                <span className="small muted clip2">{u.bio || 'New on Circle'}</span>
                {u.mutual > 0 && <span className="small">{u.mutual} mutual friend{u.mutual > 1 ? 's' : ''}</span>}
                <button className="btn sm" onClick={async () => { await add(u._id); setSug(s => s.filter(x => x._id !== u._id)); }}>Add friend</button>
              </div>
            ))}
          </div>
        </>
      )}
      <h3 className="h">Your friends ({friends.length})</h3>
      {friends.length === 0 && <div className="empty"><p>Use the search box above to find people by name.</p></div>}
      <div className="people">
        {friends.map(u => <Card key={u._id} u={u} action={<button className="txt" onClick={async () => { await api.delete('/friends/' + u._id); refresh(); }}>Unfriend</button>} />)}
      </div>
    </>
  );
}
