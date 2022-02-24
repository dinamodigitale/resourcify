import bodyParser from 'body-parser';
import express from 'express';
import mongoose from 'mongoose';
import { resourcify } from '../../resourcify';
import { Author, Post } from './models';

const app = express()
const port = 3000

mongoose.connect('mongodb://localhost/test');

app.use(bodyParser.json())

app.use('/admin', resourcify(Post, {
  sort: {
    _id: -1
  },
  populate: {
    show: [{
      path: 'author',
    }],
    update: [{
      path: 'author',
    }]
  },
  select: {title: 1}
}))

app.use('/posts', resourcify(Post, {
  //declareRouteFor: ['index', 'show'],
  sort: {
    _id: -1
  },
  populate: {
    show: [{
      path: 'author',
    }],
    update: [{
      path: 'author',
    }]
  },
  select: {title: 1}
}))

app.use('/authors', resourcify(Author, {
  pagination: true,
}))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})