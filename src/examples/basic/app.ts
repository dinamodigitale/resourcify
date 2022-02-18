import express from 'express'
import mongoose from 'mongoose';
import resourcify from '../../resourcify';
import { Author, Post } from './models';

const app = express()
const port = 3000

mongoose.connect('mongodb://localhost/test');

app.get('/', async (_req, res) => {
  res.json({
    posts: await Post.find({}),
    authors: await Author.find({})
  })
})

app.use('/posts', resourcify(Post))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})