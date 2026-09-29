const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const FriendRequest = require('../models/FriendRequest');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

// People you may know: a random mix of profiles, with bio and mutual friends
router.get('/suggestions', async (req, res) => {
  const me = await User.findById(req.user);
  const skip = new Set([String(me._id), ...me.friends.map(String)]);
  const pending = await FriendRequest.find({ status: 'pending', $or: [{ from: me._id }, { to: me._id }] });
  pending.forEach(r => { skip.add(String(r.from)); skip.add(String(r.to)); });
  const all = await User.find({ _id: { $nin: [...skip] } }).select('name avatar cover bio privacy friends').limit(60);
  const mine = new Set(me.friends.map(String));
  res.json(all.sort(() => Math.random() - 0.5).slice(0, Number(req.query.limit) || 5).map(u => ({
    _id: u._id, name: u.name, avatar: u.avatar, cover: u.cover,
    bio: u.privacy === 'friends' ? '' : u.bio,
    mutual: u.friends.filter(f => mine.has(String(f))).length
  })));
});

// Search people by name (must be defined before '/:id')
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const users = await User.find({ name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), _id: { $ne: req.user } })
    .select('name avatar').limit(10);
  res.json(users);
});

// Update my profile and privacy settings
router.put('/me', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const update = {};
  ['name', 'bio'].forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  if (['public', 'friends'].includes(req.body.privacy)) update.privacy = req.body.privacy;
  const f = req.files || {};
  if (f.avatar) update.avatar = '/uploads/' + f.avatar[0].filename;
  if (f.cover) update.cover = '/uploads/' + f.cover[0].filename;
  res.json(await User.findByIdAndUpdate(req.user, update, { new: true }).select('-password'));
});

// View a profile. Privacy is enforced HERE, on the server.
router.get('/:id', async (req, res) => {
  const u = await User.findById(req.params.id).select('-password');
  if (!u) return res.status(404).json({ message: 'User not found' });

  const me = req.user;
  const self = String(u._id) === me;
  const isFriend = u.friends.some(f => String(f) === me);
  let relation = self ? 'self' : isFriend ? 'friends' : 'none';
  if (relation === 'none') {
    const fr = await FriendRequest.findOne({ status: 'pending', $or: [{ from: me, to: u._id }, { from: u._id, to: me }] });
    if (fr) relation = String(fr.from) === me ? 'sent' : 'received';
  }

  const locked = u.privacy === 'friends' && !self && !isFriend;
  const base = { _id: u._id, name: u.name, avatar: u.avatar, cover: u.cover, privacy: u.privacy, relation, locked };
  if (locked) return res.json(base);

  const posts = await Post.find({ author: u._id }).sort('-createdAt').populate('author', 'name avatar');
  res.json({ ...base, bio: u.bio, friendCount: u.friends.length, posts });
});

module.exports = router;
