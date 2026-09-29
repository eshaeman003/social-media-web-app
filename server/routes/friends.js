const router = require('express').Router();
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const auth = require('../middleware/auth');
const { notify } = require('../utils/notify');

router.use(auth);

// My friends
router.get('/', async (req, res) => {
  const me = await User.findById(req.user).populate('friends', 'name avatar');
  res.json(me.friends);
});

// Incoming pending requests
router.get('/requests', async (req, res) => {
  res.json(await FriendRequest.find({ to: req.user, status: 'pending' }).populate('from', 'name avatar'));
});

// Send a request
router.post('/request/:userId', async (req, res) => {
  const to = req.params.userId;
  if (to === req.user) return res.status(400).json({ message: 'You cannot add yourself' });
  const target = await User.findById(to);
  if (!target) return res.status(404).json({ message: 'User not found' });
  if (target.friends.some(f => String(f) === req.user)) return res.status(400).json({ message: 'Already friends' });
  const exists = await FriendRequest.findOne({ status: 'pending', $or: [{ from: req.user, to }, { from: to, to: req.user }] });
  if (exists) return res.status(400).json({ message: 'A request is already pending' });

  const fr = await FriendRequest.create({ from: req.user, to });
  await notify(req.app.get('io'), { user: to, from: req.user, type: 'friend_request' });
  res.json(fr);
});

// Accept: both users become friends
router.put('/requests/:id/accept', async (req, res) => {
  const fr = await FriendRequest.findOne({ _id: req.params.id, to: req.user, status: 'pending' });
  if (!fr) return res.status(404).json({ message: 'Request not found' });
  fr.status = 'accepted';
  await fr.save();
  await User.findByIdAndUpdate(fr.from, { $addToSet: { friends: fr.to } });
  await User.findByIdAndUpdate(fr.to, { $addToSet: { friends: fr.from } });
  await notify(req.app.get('io'), { user: fr.from, from: req.user, type: 'friend_accepted' });
  res.json({ ok: true });
});

// Reject: delete the request
router.put('/requests/:id/reject', async (req, res) => {
  await FriendRequest.findOneAndDelete({ _id: req.params.id, to: req.user });
  res.json({ ok: true });
});

// Unfriend
router.delete('/:friendId', async (req, res) => {
  await User.findByIdAndUpdate(req.user, { $pull: { friends: req.params.friendId } });
  await User.findByIdAndUpdate(req.params.friendId, { $pull: { friends: req.user } });
  await FriendRequest.deleteMany({ $or: [{ from: req.user, to: req.params.friendId }, { from: req.params.friendId, to: req.user }] });
  res.json({ ok: true });
});

module.exports = router;
