const { Schema, model } = require('mongoose');
module.exports = model('Story', new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  media: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // MongoDB deletes it after 24 hours
}));
