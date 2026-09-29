const { Schema, model } = require('mongoose');
module.exports = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  cover: { type: String, default: '' },
  saved: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Post' }],
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  privacy: { type: String, enum: ['public', 'friends'], default: 'public' } // who can see the profile
}, { timestamps: true }));
