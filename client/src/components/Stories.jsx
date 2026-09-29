import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errText, media } from '../api';
import { useAuth } from '../AuthContext';
import { Avatar, Icon, ago } from './ui';
import { useToast } from './Toast';

export default function Stories({ friends, tick }) {
  const { user } = useAuth();
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [view, setView] = useState(null);
  const fileRef = useRef();
  const load = () => api.get('/stories').then(r => setGroups(r.data));
  useEffect(() => { load(); }, [tick]);

  const upload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const fd = new FormData(); fd.append('media', f);
    try { await api.post('/stories', fd); toast('Story added for 24 hours'); load(); } catch (er) { toast(errText(er)); }
    e.target.value = '';
  };
  const withStory = new Set(groups.map(g => g.author._id));

  return (
    <>
      <section className="card"><h4 className="ctitle">Stories</h4><div className="strip">
        <button className="chip" onClick={() => fileRef.current.click()}><span className="addring"><Icon n="plus" /></span><small>Add story</small></button>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={upload} />
        {groups.map((g, gi) => (
          <button key={g.author._id} className="chip" onClick={() => setView(gi)}>
            <Avatar user={g.author} size={54} ring /><small>{g.author._id === user._id ? 'Your story' : g.author.name.split(' ')[0]}</small>
          </button>
        ))}
        {friends.filter(f => !withStory.has(f._id)).map(f => (
          <Link key={f._id} to={'/profile/' + f._id} className="chip dim"><Avatar user={f} size={54} /><small>{f.name.split(' ')[0]}</small></Link>
        ))}
      </div></section>
      {view !== null && <Viewer groups={groups} start={view} onClose={() => setView(null)} />}
    </>
  );
}

function Viewer({ groups, start, onClose }) {
  const [gi, setGi] = useState(start);
  const [i, setI] = useState(0);
  const g = groups[gi];
  const s = g.stories[i];
  const next = () => {
    if (i + 1 < g.stories.length) setI(i + 1);
    else if (gi + 1 < groups.length) { setGi(gi + 1); setI(0); }
    else onClose();
  };
  const prev = () => { if (i > 0) setI(i - 1); else if (gi > 0) { setGi(gi - 1); setI(0); } };
  useEffect(() => {
    if (s.mediaType === 'image') { const t = setTimeout(next, 5000); return () => clearTimeout(t); }
  }, [gi, i]);

  return (
    <div className="viewer" onClick={onClose}>
      <div className="vbox" onClick={e => e.stopPropagation()}>
        <div className="bars">{g.stories.map((_, k) => <i key={k} className={k <= i ? 'on' : ''} />)}</div>
        <div className="vhead"><Avatar user={g.author} size={34} /><b>{g.author.name}</b><small>{ago(s.createdAt)}</small></div>
        {s.mediaType === 'video'
          ? <video key={s._id} src={media(s.media)} autoPlay controls onEnded={next} />
          : <img key={s._id} src={media(s.media)} alt="" />}
        <button className="vnav l" onClick={prev} aria-label="Previous" />
        <button className="vnav r" onClick={next} aria-label="Next" />
      </div>
    </div>
  );
}
