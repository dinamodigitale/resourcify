import mongoose from "mongoose";

export const Post = mongoose.model('Post', new mongoose.Schema({
  author: {
    type: 'ObjectId',
    ref: 'Author'
  },
  title: {type: String, default: '', minlength: 10}
}));

export const Author = mongoose.model('Author', new mongoose.Schema({
  name: {type: String, default: ''}
}));