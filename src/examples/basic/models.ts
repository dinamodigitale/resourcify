import mongoose from "mongoose";

interface AuthorInterface  {
  name: string
}

export const Post = mongoose.model('Post', new mongoose.Schema({
  author: {
    type: 'ObjectId',
    ref: 'Author'
  },
  title: {type: String, default: '', minlength: 10}
}));


export const Author = mongoose.model('Author', new mongoose.Schema<AuthorInterface>({
  name: {type: String, default: ''}
}));