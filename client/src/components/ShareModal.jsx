import { useEffect, useState } from 'react';
import api, { errText } from '../api';
import { Avatar } from './ui';
import { useToast } from './Toast';

export default function ShareModal({ post, onClose }) {
  const toast = useToast();
  const [friends, setFriends] = useState([]);
  useEffect(() => { api.get('/friends').then(r => setFriends(r.data)); }, []);
  const send = async (f) => {
    try { await api.post('/chat/' + f._id, { postId: post._id }); toast('Sent to ' + f.name); onClose(); }
    catch (e) { toast(errText(e)); }
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Share with a friend</h3>
        {friends.length === 0 && <p className="muted">Add friends first, then you can share posts with them.</p>}
        {friends.map(f => (
          <button key={f._id} className="rrow linkrow" onClick={() => send(f)}>
            <Avatar user={f} size={38} /><span className="name grow">{f.name}</span><span className="btn sm">Send</span>
          </button>
        ))}
        <button className="txt" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
