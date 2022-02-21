import express from 'express'
import mongoose from 'mongoose';
import {resourcify} from '../../resourcify';
import { Author, Post } from './models';

const app = express()
const port = 3000

mongoose.connect('mongodb://localhost/test');

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/posts', resourcify(Post, {
  pagination: true,
}))

app.use('/authors', resourcify(Author, {
  pagination: true,
}))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})