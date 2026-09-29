import { useEffect } from 'react';
import { useAuth } from '../AuthContext';

// Keeps like and comment counts live in any list of posts
export default function useLive(setPosts) {
  const { socket } = useAuth();
  useEffect(() => {
    if (!socket) return;
    const like = d => setPosts(p => p.map(x => x._id === d.postId ? { ...x, likes: d.likes } : x));
    const com = d => setPosts(p => p.map(x => x._id === d.postId ? { ...x, commentCount: d.commentCount } : x));
    socket.on('post:like', like); socket.on('comment:new', com);
    return () => { socket.off('post:like', like); socket.off('comment:new', com); };
  }, [socket]);
}
