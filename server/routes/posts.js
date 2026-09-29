const router = require('express').Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { notify, emitTo } = require('../utils/notify');

router.use(auth);

// Create a post (text and/or one image/video)
router.post('/', upload.single('media'), async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text && !req.file) return res.status(400).json({ message: 'Write something or attach a photo or video' });
  const post = await Post.create({
    author: req.user, text,
    media: req.file ? '/uploads/' + req.file.filename : '',
    mediaType: req.file ? (req.file.mimetype.startsWith('video') ? 'video' : 'image') : ''
  });
  await post.populate('author', 'name avatar');
  const me = await User.findById(req.user);
  emitTo(req.app.get('io'), me.friends, 'post:new', post); // live update for friends
  res.json(post);
});

// Feed: my posts + my friends' posts
router.get('/feed', async (req, res) => {
  const me = await User.findById(req.user);
  const q = { author: { $in: [me._id, ...me.friends] } };
  if (req.query.type === 'video') { // videos also include public profiles
    const pub = await User.find({ privacy: 'public' }).distinct('_id');
    q.author = { $in: [me._id, ...me.friends, ...pub] };
    q.mediaType = 'video';
  }
  res.json(await Post.find(q).sort('-createdAt').limit(50).populate('author', 'name avatar'));
});

// Saved posts
router.get('/saved', async (req, res) => {
  const me = await User.findById(req.user).populate({ path: 'saved', populate: { path: 'author', select: 'name avatar' } });
  res.json(me.saved.filter(Boolean).reverse());
});
router.post('/:id/save', async (req, res) => {
  const me = await User.findById(req.user);
  const has = me.saved.some(x => String(x) === req.params.id);
  me.saved = has ? me.saved.filter(x => String(x) !== req.params.id) : [...me.saved, req.params.id];
  await me.save();
  res.json({ saved: me.saved });
});

router.delete('/:id', async (req, res) => {
  const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  await Comment.deleteMany({ post: post._id });
  res.json({ ok: true });
});

// Like / unlike
router.post('/:id/like', async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const liked = post.likes.some(l => String(l) === req.user);
  post.likes = liked ? post.likes.filter(l => String(l) !== req.user) : [...post.likes, req.user];
  await post.save();

  const io = req.app.get('io');
  const author = await User.findById(post.author);
  emitTo(io, [post.author, ...author.friends, req.user], 'post:like', { postId: post._id, likes: post.likes });
  if (!liked) await notify(io, { user: post.author, from: req.user, type: 'like', post: post._id });
  res.json({ likes: post.likes });
});

router.get('/:id/comments', async (req, res) => {
  res.json(await Comment.find({ post: req.params.id }).sort('createdAt').populate('author', 'name avatar'));
});

router.post('/:id/comments', async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const comment = await Comment.create({ post: post._id, author: req.user, text });
  await comment.populate('author', 'name avatar');
  post.commentCount += 1;
  await post.save();

  const io = req.app.get('io');
  const author = await User.findById(post.author);
  emitTo(io, [post.author, ...author.friends, req.user], 'comment:new', { postId: post._id, comment, commentCount: post.commentCount });
  await notify(io, { user: post.author, from: req.user, type: 'comment', post: post._id });
  res.json(comment);
});

module.exports = router;
