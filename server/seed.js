// Demo data for screenshots. Run:  node seed.js      (add data)   |   node seed.js remove   (delete it)
require('dotenv').config();
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const FriendRequest = require('./models/FriendRequest');

const people = [
  ['Ayesha Khan', 'Coffee, code and long walks.'], ['Bilal Ahmed', 'Photographer from Lahore.'],
  ['Sana Malik', 'Design student. Sketchbook always open.'], ['Hamza Ali', 'Cricket, chai, repeat.'],
  ['Zara Sheikh', 'Book lover.'], ['Usman Tariq', 'Building things with JavaScript.'],
  ['Hira Noor', 'Baking on weekends.'], ['Danish Raza', 'Trying every food street in Islamabad.']
];
const posts = [
  [0, 'Finally finished my internship project. Small wins matter.'], [0, 'Morning coffee and a fresh to-do list.'],
  [1, 'Golden hour at Margalla Hills never gets old.'], [1, 'New lens arrived today. Expect a lot of photos.'],
  [2, 'Sketching ideas for a new app design tonight.'], [3, 'Great match today! What a finish.'],
  [2, 'Colour palettes are my love language.'], [3, 'Anyone up for chai this evening?']
];
const comments = ['Love this!', 'Congratulations!', 'Looks amazing', 'Count me in', 'So true'];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const demos = await User.find({ email: /@circle\.test$/ });
  const ids = demos.map(u => u._id);
  if (process.argv[2] === 'remove') {
    await Post.deleteMany({ author: { $in: ids } });
    await Comment.deleteMany({ author: { $in: ids } });
    await FriendRequest.deleteMany({ $or: [{ from: { $in: ids } }, { to: { $in: ids } }] });
    await User.updateMany({}, { $pull: { friends: { $in: ids } } });
    await User.deleteMany({ _id: { $in: ids } });
    console.log('Demo data removed'); return process.exit(0);
  }
  if (demos.length) { console.log('Demo data already exists. Run "node seed.js remove" first to reset it.'); return process.exit(0); }

  const pw = await bcrypt.hash('demo1234', 10);
  const d = [];
  for (let i = 0; i < people.length; i++)
    d.push(await User.create({ name: people[i][0], email: `demo${i + 1}@circle.test`, password: pw, bio: people[i][1] }));
  const real = await User.find({ email: { $not: /@circle\.test$/ } });

  // demo friends 0-3 are friends with everyone real (and each other)
  const friends = d.slice(0, 4);
  for (const u of friends) {
    const others = [...friends.filter(x => x._id !== u._id), ...real].map(x => x._id);
    await User.updateOne({ _id: u._id }, { $addToSet: { friends: { $each: others } } });
  }
  for (const r of real) await User.updateOne({ _id: r._id }, { $addToSet: { friends: { $each: friends.map(f => f._id) } } });
  // demo 4-5 send friend requests to real users (demo 6-7 stay as suggestions)
  for (const r of real) for (const u of d.slice(4, 6)) await FriendRequest.create({ from: u._id, to: r._id });

  const everyone = [...friends, ...real];
  for (let i = 0; i < posts.length; i++) {
    const likers = everyone.filter((_, k) => (k + i) % 2 === 0).map(x => x._id);
    const post = await Post.create({ author: friends[posts[i][0]]._id, text: posts[i][1], likes: likers, createdAt: new Date(Date.now() - (i + 1) * 3600e3 * 3) });
    const n = 1 + (i % 3);
    for (let c = 0; c < n; c++) await Comment.create({ post: post._id, author: everyone[(c + i) % everyone.length]._id, text: comments[(c + i) % comments.length] });
    post.commentCount = n; await post.save();
  }
  console.log('Demo data added: 8 people, 8 posts, likes, comments and 2 friend requests.');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
