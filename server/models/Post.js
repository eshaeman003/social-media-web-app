const { Schema, model } = require('mongoose');
module.exports = model('Post', new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  media: { type: String, default: '' },
  mediaType: { type: String, enum: ['', 'image', 'video'], default: '' },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  commentCount: { type: Number, default: 0 }
}, { timestamps: true }));
