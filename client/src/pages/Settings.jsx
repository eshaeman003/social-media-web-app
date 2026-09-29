import { useState } from 'react';
import api, { errText } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../components/Toast';

export default function Settings() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [privacy, setPrivacy] = useState(user.privacy);
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', name); fd.append('bio', bio); fd.append('privacy', privacy);
    if (avatar) fd.append('avatar', avatar);
    if (cover) fd.append('cover', cover);
    try { setUser((await api.put('/users/me', fd)).data); toast('Changes saved'); } catch (er) { toast(errText(er)); }
  };

  return (
    <form className="panel" onSubmit={save}>
      <h3 className="h">Profile and privacy</h3>
      <label>Name<input className="inp" value={name} onChange={e => setName(e.target.value)} required /></label>
      <label>Bio<textarea className="inp" rows="3" value={bio} onChange={e => setBio(e.target.value)} /></label>
      <label>Profile photo<input type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0])} /></label>
      <label>Cover photo (background of your profile)<input type="file" accept="image/*" onChange={e => setCover(e.target.files[0])} /></label>
      <label>Who can see my profile and posts
        <select className="inp" value={privacy} onChange={e => setPrivacy(e.target.value)}>
          <option value="public">Everyone</option>
          <option value="friends">Friends only</option>
        </select>
      </label>
      <button className="btn big">Save changes</button>
    </form>
  );
}
