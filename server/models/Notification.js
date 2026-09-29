const { Schema, model } = require('mongoose');
module.exports = model('Notification', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },   // who receives it
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },   // who caused it
  type: { type: String, enum: ['like', 'comment', 'friend_request', 'friend_accepted'], required: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post' },
  read: { type: Boolean, default: false }
}, { timestamps: true }));
