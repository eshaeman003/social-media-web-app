const Notification = require('../models/Notification');

// Save a notification in MongoDB, then push it live to the receiver's room
exports.notify = async (io, { user, from, type, post }) => {
  if (String(user) === String(from)) return;
  const n = await Notification.create({ user, from, type, post });
  await n.populate('from', 'name avatar');
  io.to(String(user)).emit('notification', n);
};

// Emit one event to several users' rooms
exports.emitTo = (io, ids, event, data) => {
  [...new Set(ids.map(String))].forEach(id => io.to(id).emit(event, data));
};
