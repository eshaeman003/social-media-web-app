const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { emitTo } = require('../utils/notify');

router.use(auth);
const withPost = { path: 'post', select: 'text media mediaType author', populate: { path: 'author', select: 'name' } };

// Friends with their last message and unread count
router.get('/conversations', async (req, res) => {
  const me = await User.findById(req.user).populate('friends', 'name avatar');
  const msgs = await Message.find({ $or: [{ from: req.user }, { to: req.user }] }).sort('-createdAt').limit(300);
  const out = me.friends.map(f => {
    const mine = msgs.filter(m => String(m.from) === String(f._id) || String(m.to) === String(f._id));
    const last = mine[0];
    return {
      user: f,
      last: last ? { text: last.text || 'Shared a post', createdAt: last.createdAt, mine: String(last.from) === req.user } : null,
      unread: mine.filter(m => String(m.to) === req.user && !m.read).length
    };
  });
  out.sort((a, b) => new Date(b.last?.createdAt || 0) - new Date(a.last?.createdAt || 0));
  res.json(out);
});

// Messages with one friend (also marks them as read)
router.get('/:userId', async (req, res) => {
  const u = req.params.userId;
  await Message.updateMany({ from: u, to: req.user, read: false }, { read: true });
  res.json(await Message.find({ $or: [{ from: req.user, to: u }, { from: u, to: req.user }] })
    .sort('createdAt').limit(200).populate(withPost));
});

// Send a message (or share a post) to a friend, delivered live over Socket.IO
router.post('/:userId', async (req, res) => {
  const to = req.params.userId;
  const me = await User.findById(req.user);
  if (!me.friends.some(f => String(f) === to)) return res.status(403).json({ message: 'You can only message friends' });
  const text = (req.body.text || '').trim();
  if (!text && !req.body.postId) return res.status(400).json({ message: 'Message is empty' });
  const m = await Message.create({ from: req.user, to, text, post: req.body.postId || undefined });
  const msg = await Message.findById(m._id).populate(withPost);
  emitTo(req.app.get('io'), [to, req.user], 'message:new', msg);
  res.json(msg);
});

module.exports = router;
