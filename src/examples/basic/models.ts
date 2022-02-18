import mongoose from "mongoose";

export const Post = mongoose.model('Post', new mongoose.Schema({
  author: {
    type: 'ObjectId',
    ref: 'Author'
  },
  title: String
}));

export const Author = mongoose.model('Author', new mongoose.Schema({
  name: String
}));
