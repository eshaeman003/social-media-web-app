const router = require('express').Router();
const Story = require('../models/Story');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.post('/', upload.single('media'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a photo or video' });
  const s = await Story.create({
    author: req.user, media: '/uploads/' + req.file.filename,
    mediaType: req.file.mimetype.startsWith('video') ? 'video' : 'image'
  });
  res.json(s);
});

// Active stories (last 24h) from me and my friends, grouped by person
router.get('/', async (req, res) => {
  const me = await User.findById(req.user);
  const list = await Story.find({ author: { $in: [me._id, ...me.friends] }, createdAt: { $gt: new Date(Date.now() - 864e5) } })
    .sort('createdAt').populate('author', 'name avatar');
  const groups = {};
  list.forEach(s => { (groups[s.author._id] ??= { author: s.author, stories: [] }).stories.push(s); });
  res.json(Object.values(groups));
});

module.exports = router;
