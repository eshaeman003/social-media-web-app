const { Schema, model } = require('mongoose');
module.exports = model('Message', new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  post: { type: Schema.Types.ObjectId, ref: 'Post' }, // set when a post is shared in chat
  read: { type: Boolean, default: false }
}, { timestamps: true }));
