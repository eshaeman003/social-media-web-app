import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import api, { errText, media } from '../api';
import { useAuth } from '../AuthContext';
import { Avatar, ago } from '../components/ui';
import { useToast } from '../components/Toast';

export default function Chat() {
  const { id } = useParams();
  const { user, socket } = useAuth();
  const { refresh, tick } = useOutletContext();
  const toast = useToast();
  const [convs, setConvs] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const endRef = useRef();
  const loadConvs = () => api.get('/chat/conversations').then(r => setConvs(r.data));

  useEffect(() => { loadConvs(); }, [tick, id]);
  useEffect(() => {
    if (!id) return setMsgs([]);
    api.get('/chat/' + id).then(r => { setMsgs(r.data); refresh(); });
  }, [id]);

  // Live messages
  useEffect(() => {
    if (!socket) return;
    const on = (m) => {
      const other = String(m.from) === user._id ? String(m.to) : String(m.from);
      if (other === id) {
        setMsgs(p => p.some(x => x._id === m._id) ? p : [...p, m]);
        if (String(m.to) === user._id) api.get('/chat/' + id).then(refresh);
      }
      loadConvs();
    };
    socket.on('message:new', on);
    return () => socket.off('message:new', on);
  }, [socket, id]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await api.post('/chat/' + id, { text });
      setMsgs(p => p.some(x => x._id === data._id) ? p : [...p, data]);
      setText(''); loadConvs();
    } catch (er) { toast(errText(er)); }
  };
  const cur = convs.find(c => c.user._id === id)?.user;

  return (
    <div className={'chat' + (id ? ' open' : '')}>
      <div className="clist">
        <h3 className="h">Messages</h3>
        {convs.length === 0 && <p className="muted small pad">Add friends to start chatting.</p>}
        {convs.map(c => (
          <Link key={c.user._id} to={'/chat/' + c.user._id} className={'crow' + (c.user._id === id ? ' active' : '')}>
            <Avatar user={c.user} size={44} />
            <div className="grow"><b>{c.user.name}</b><div className="small muted clip">{c.last ? (c.last.mine ? 'You: ' : '') + c.last.text : 'Say hi'}</div></div>
            {c.unread > 0 && <i className="count">{c.unread}</i>}
          </Link>
        ))}
      </div>
      <div className="cthread">
        {!id ? <div className="empty"><p>Pick a friend to start chatting.</p></div> : (
          <>
            <div className="chead">
              <Link to="/chat" className="txt back">Back</Link>
              {cur && <><Avatar user={cur} size={38} /><Link to={'/profile/' + cur._id} className="name">{cur.name}</Link></>}
            </div>
            <div className="msgs">
              {msgs.map(m => (
                <div key={m._id} className={'bub' + (String(m.from) === user._id ? ' me' : '')}>
                  {m.post && (
                    <div className="shared"><b>{m.post.author?.name}</b>
                      {m.post.text && <p>{m.post.text.slice(0, 120)}</p>}
                      {m.post.mediaType === 'image' && <img src={media(m.post.media)} alt="" />}
                      {m.post.mediaType === 'video' && <video src={media(m.post.media)} controls />}
                    </div>
                  )}
                  {m.text && <span>{m.text}</span>}
                  <small>{ago(m.createdAt)}</small>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form className="row csend" onSubmit={send}>
              <input className="inp" placeholder="Write a message" value={text} onChange={e => setText(e.target.value)} />
              <button className="btn">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
