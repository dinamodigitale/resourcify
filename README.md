# Resourcify

A Library for creating RESTful API with mongoose and express

## Installation

```bash
npm install @dinamodigitale/resourcify
```

## Usage

```typescript
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
  declareRouteFor: ['index', 'show'],
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
```
## Routes 

Here is a list of all the routes that the library supports:

### Create 

 `POST /routename` Create a new document.

 Example:
 ```bash 
 curl --request POST \
  --url http://localhost:3000/authors \
  --header 'Content-Type: application/json' \
  --data '{
	"name": "Author 1645715862"
}'
 ```

### Update 

 `PATCH /routename/:id` Update a document by id.

 Example:
 ```bash 
curl --request PATCH \
  --url http://localhost:3000/posts/621490fe3115044c1af7dd7c \
  --header 'Content-Type: application/json' \
  --data '{
	"title": "Bla bla bla"
}'
 ```

### Delete 

 `DELETE /routename/:id` Delete a document by id.

 Example:
 ```bash 
curl --request DELETE --url http://localhost:3000/posts/621490fe3115044c1af7dd7c
 ```

### Index 

 `GET /routename` Get a list of documents from a collection.

 Example:
 ```bash 
curl --request GET --url http://localhost:3000/posts
 ```

### One document 

 `GET /routename/:id` Get a document by id

 Example:
 ```bash 
curl --request GET --url http://localhost:3000/posts/621490fe3115044c1af7dd7c
 ```

### Resource 

 `POST /routename/resource` Build query, section, projection, pagination, sort on a collection

 Example:
 ```bash 
curl --request POST \
  --url http://localhost:3000/posts/resource \
  --header 'Content-Type: application/json' \
  --data '{
	"limit": 10,
	"sort": {"_id": -1},
	"populate": "author",
	"offset": 0,
	"query": {
		"author": { "$ne": null }
	},
	"pagination": true
}'
 ```
Note that the pagination details are injected on the response header as follows:
```text
x-limit	10
x-offset	0
x-total-records	1
x-total-pages	1
```

## License

MIT

## Author

[@moty66](https://github.com/moty66),  [Dinamo Digitale](https://github.com/orgs/dinamodigitale/)