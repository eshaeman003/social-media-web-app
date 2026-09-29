import { useState } from 'react';
import { media } from '../api';

const P = {
  home: ['M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0'],
  sliders: ['M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
  heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z'],
  comment: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  image: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M7 8.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0', 'M21 15l-5-5L5 21'],
  out: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5M21 12H9'],
  search: ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'M21 21l-4.3-4.3'],
  plus: ['M12 5v14M5 12h14'],
  video: ['M5 3l14 9-14 9z'],
  bookmark: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  share: ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4z'],
};

export const Icon = ({ n, size = 20, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {P[n].map((d, i) => <path key={i} d={d} />)}
  </svg>
);

export function Avatar({ user, size = 40, ring }) {
  const [bad, setBad] = useState(false);
  const s = { width: size, height: size, fontSize: size * 0.4 };
  const inner = user?.avatar && !bad
    ? <img className="avatar" style={s} src={media(user.avatar)} alt="" onError={() => setBad(true)} />
    : <span className="avatar ph" style={s}>{user?.name?.[0]?.toUpperCase()}</span>;
  return ring ? <span className="ring">{inner}</span> : inner;
}

export function Media({ post }) {
  const [bad, setBad] = useState(false);
  if (!post.media) return null;
  if (bad) return <div className="pmissing">This {post.mediaType} is no longer available</div>;
  return post.mediaType === 'video'
    ? <video className="pmedia" src={media(post.media)} controls onError={() => setBad(true)} />
    : <img className="pmedia" src={media(post.media)} alt="" onError={() => setBad(true)} />;
}

export const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  return new Date(d).toLocaleDateString();
};
