# Resourcify

A Library for creating RESTful API with mongoose and express

## Installation

```bash
npm install @dinamodigitale/resourcify
```

## Usage

You can check the basic example from the src/examples directory or paste this in a js/ts file

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
## Options 

Sorry for being lazy, I am pasting the interface here 
```typescript 
ResourcifyOptionsInterface {
  /**
   * Policies list, this is deisgnated to be used for authorization only like roles, auth, etc.
   * @example create: [IsAuthorized, (req,res,next) => req.something ? next() : res.status(401).send('Unauthorized')]
   */
  policies?: {
    create?: RequestHandler | RequestHandler[]
    index?: RequestHandler | RequestHandler[]
    show?: RequestHandler | RequestHandler[]
    update?: RequestHandler | RequestHandler[]
    delete?: RequestHandler | RequestHandler[]
  }
  /**
   * If true, only the routes index, resource and show will be declared
   */
  readOnly?: Boolean
  /**
   * Array of actions to be declared
   * @example ['index', 'show']
   */
  declareRouteFor?: Array<ResourcifyActions>
  /**
   * Mongoose populate options
   * @example {index: [{ path: 'user', select: 'name' }]}
   */
  populate?: {
    index?: PopulateOptions | PopulateOptions[];
    show?: PopulateOptions | PopulateOptions[];
    create?: PopulateOptions | PopulateOptions[];
    update?: string | PopulateOptions | PopulateOptions[];
  }
  /**
   * Mongoose FilterQuery to be passed for index or show
   * @example {index: { $or: [{ name: 'John' }, { name: 'Jane' }] }}
   */
  query?: {
    index?: (req: Request) => FilterQuery<unknown>;
    show?: (req: Request) => FilterQuery<unknown>;
  }
  /**
   * Sorting object
   * @example {_id: -1}
   */
  sort?: Record<string, 1 | -1>
  /**
   * Select fields (projection) object
   * @example {_id: 1, name: 1}
   * @example {password: 0}
   */
  select?: Record<string, 1 | 0> | string[] | string
  /**
   * Enable pagination for index, will use req.body.offset and req.body.limit or req.query.offset and req.query.limit
   */
  pagination?: boolean
  /**
   * Middleware to be executed before the route handler
   * @example {create: [(req, res, next)=>next()]}
   */
  middleware?: {
    create?: RequestHandler | RequestHandler[]
    index?: RequestHandler | RequestHandler[]
    show?: RequestHandler | RequestHandler[]
    update?: RequestHandler | RequestHandler[]
    delete?: RequestHandler | RequestHandler[]
  }
}
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