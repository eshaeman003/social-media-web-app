import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errText } from '../api';
import { useAuth } from '../AuthContext';
import { Avatar, Icon, Media, ago } from './ui';
import { useToast } from './Toast';
import ShareModal from './ShareModal';

export default function PostCard({ post, onDelete }) {
  const { user, setUser, socket } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [share, setShare] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const liked = post.likes.includes(user._id);
  const saved = (user.saved || []).includes(post._id);

  // New comments on an open post appear live
  useEffect(() => {
    if (!socket || !open) return;
    const on = (d) => d.postId === post._id && setComments(p => p.some(c => c._id === d.comment._id) ? p : [...p, d.comment]);
    socket.on('comment:new', on);
    return () => socket.off('comment:new', on);
  }, [socket, open, post._id]);

  const loadComments = async () => setComments((await api.get(`/posts/${post._id}/comments`)).data);
  const toggle = async () => { if (!open) await loadComments(); setOpen(!open); };
  const like = () => api.post(`/posts/${post._id}/like`).catch(e => toast(errText(e)));
  const save = async () => {
    try { const { data } = await api.post(`/posts/${post._id}/save`); setUser({ ...user, saved: data.saved }); toast(saved ? 'Removed from saved' : 'Saved'); }
    catch (e) { toast(errText(e)); }
  };
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { text });
      setText('');
      if (open) setComments(p => p.some(c => c._id === data._id) ? p : [...p, data]);
      else { await loadComments(); setOpen(true); }
    } catch (er) { toast(errText(er)); }
  };

  return (
    <article className="post card">
      <div className="phead">
        <Avatar user={post.author} size={40} />
        <div className="grow">
          <Link to={'/profile/' + post.author._id} className="name">{post.author.name}</Link>
          <div className="muted small">{ago(post.createdAt)}</div>
        </div>
        {post.author._id === user._id && <button className="txt" onClick={() => onDelete(post._id)}>Delete</button>}
      </div>
      {post.text && !post.media && <p className="ptext">{post.text}</p>}
      <Media post={post} />
      <div className="pacts">
        <button className={'pill' + (liked ? ' on' : '')} onClick={like}><Icon n="heart" size={16} fill={liked ? 'currentColor' : 'none'} /> {post.likes.length}</button>
        <button className="pill" onClick={toggle}><Icon n="comment" size={16} /> {post.commentCount}</button>
        <button className="iconbtn" onClick={() => setShare(true)} aria-label="Share"><Icon n="share" size={19} /></button>
        <span className="grow" />
        <button className="iconbtn" onClick={save} aria-label="Save"><Icon n="bookmark" size={19} fill={saved ? 'currentColor' : 'none'} /></button>
      </div>
      {post.media && post.text && <p className="pcap"><b>{post.author.name}</b> {post.text}</p>}
      {post.commentCount > 0 && <button className="txt vall" onClick={toggle}>{open ? 'Hide comments' : `View all ${post.commentCount} comments`}</button>}
      {open && <div className="comments">{comments.map(c => <p key={c._id}><b>{c.author.name}</b> {c.text}</p>)}</div>}
      <form className="cform" onSubmit={send}>
        <Avatar user={user} size={30} />
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment…" />
        <button>Post</button>
      </form>
      {share && <ShareModal post={post} onClose={() => setShare(false)} />}
    </article>
  );
}
