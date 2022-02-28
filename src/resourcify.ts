import { randomBytes } from 'crypto';
import { Request, RequestHandler, Response, Router } from 'express';
import { Model } from "mongoose";
import { ResourcifyActions, ResourcifyOptionsInterface, ResourcifyRouteHandler } from './types';

function resposneError(req: Request, res: Response, err: Error | unknown) {
  if(err instanceof Error) {
    //TODO Better status code handler, we need to know if it's a mongoose/mongo error or something else
    const statusCode = err.name && err.name === 'ValidationError' ? 422 : 500
    const message  = err && err.message ? err.message : String(err);
    const name = err && err.name ? err.name : 'ResourcifyServerError'
    console.error('XX [%s] ERR %s %s. %s', res.locals.reqId || 'NA', name, message, statusCode);
    
    res
      .status(statusCode)
      .json({
        message,
        name: name,
        validation: name === 'ValidationError' ? err : undefined,
        fileName: process.env.NODE_ENV === 'production' ? undefined : __filename,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack?.split("\n"),
      });
  } else {
    res
      .status(500)
      .json({
        message: err,
        name: 'ResourcifyServerError',
        fileName: process.env.NODE_ENV === 'production' ? undefined : __filename
      });
  }
}

const index: ResourcifyRouteHandler = (model, options) => {
  return async (req, res) => {
    req.body = req.body || {};
    const q = options.query && options.query.index ? await options.query.index(req) : {};

    Object.assign(q, req.body?.query || {});

    let find = model.find(q);
    const limit = +(req.body.limit || req.query.limit) || 50
    const offset = +(req.body.offset || req.query.offset) || 0
    if (options.pagination || req.body.pagination) {
      const totalRecords = await model.find(q).select('_id').limit(process.env.PAGINATION_MAX_LIMIT ? +process.env.PAGINATION_MAX_LIMIT : 100000).countDocuments();
      const pagination = {
        'x-limit': limit,
        'x-offset': offset,
        'x-total-records': totalRecords,
        'x-total-pages': Math.ceil(totalRecords / limit)
      };
      res.set(pagination)
    }

    if (limit) {
      find = find.limit(limit)
    }

    if (offset) {
      find = find.skip(offset)
    }

    if (req.body.populate) {
      find = find.populate(req.body.populate);
    } else if (options.populate && options.populate.index) {
      find = find.populate(options.populate.index);
    }


    if (req.body.sort) {
      find = find.sort(req.body.sort);
    } else if (options.sort) {
      find = find.sort(options.sort);
    }

    if (req.body.select) {
      find = find.select(req.body.select);
    } else if (options.select) {
      find = find.select(options.select);
    }

    try {
      res.json(await find)
    } catch (err) {
      resposneError(req, res, err);
    }
  };
}

const show: ResourcifyRouteHandler = (model, options = {}) => {

  return async (req, res) => {
    const q = {
      _id: req.params.id
    };

    if (options.query?.show) {
      Object.assign(q, await options.query.show(req));
    }

    let find = model.findOne(q);

    if (options.populate?.show) {
      find = find.populate(options.populate.show);
    }

    try {
      let item = await find;
      res.status(item ? 200 : 404).json(item || { message: 'not-found' });
    } catch (err: any) {
      resposneError(req, res, err);
    }
  }

};

const create: ResourcifyRouteHandler = (model, options = {}) => {

  return async (req, res) => {
    try {
      let item = await model.create(req.body);

      if (options.populate?.create) {
        item = await item.populate(options.populate.create)
      }
      res.status(201).json(item);
    } catch (err: any) {
      resposneError(req, res, err);
    }
  }
};

const update: ResourcifyRouteHandler = (model, options = {}) => {

  return async (req, res) => {
    try {
      const doc = await model.findById(req.params.id)
      if (!doc) {
        return res.status(404).json({ message: 'not-found' })
      }
      Object.assign(doc, req.body)
      doc && await doc.save();
      res.json(options.populate?.update ? await doc.populate(options.populate.update) : doc)
    } catch (err) {
      return resposneError(req, res, err);
    }
  }
};

const remove: ResourcifyRouteHandler = (model) => {

  return async (req: Request, res: Response) => {
    try {
      const deleted = await model.findOneAndRemove({ _id: req.params.id });
      res.status(deleted ? 204 : 404).end()
    } catch (err: any) {
      resposneError(req, res, err);
    }
  }
};


export function resourcify<T>(model: Model<T>, options: ResourcifyOptionsInterface = {}) {
  const router = Router()

  const LoggerMiddleware: RequestHandler = async (req, res, next) => {
    const reqId = randomBytes(8).toString("hex");
    // Add the request Id to locals to be shared for future console logs
    res.locals.reqId = reqId;
    const startTime = +new Date();
    console.log('~> [%s] REQ %s %s collection:%s params:%s query:%s', reqId, req.method, req.originalUrl, model.collection.name, req.params, req.query);
    res.on('close', () => {
      console.log('<~ [%s] RES %s %s %s time:%sms', reqId, res.statusCode, req.method, req.originalUrl, +new Date() - startTime);
    })
    next();
  }

  if (declarableRoute('index', options)) {
    router.get('/', LoggerMiddleware, options.middleware?.index || [], options.policies?.index || [], index(model, options));
  }
  
  // router.post('/new', LoggerMiddleware, (req, res) => res.json(new model()));

  if (declarableRoute('resource', options)) {
    router.post('/resource', LoggerMiddleware, options.middleware?.index || [], options.policies?.index || [], index(model, options));
  }

  if (declarableRoute('show', options)) {
    router.get('/:id', LoggerMiddleware, options.middleware?.show || [], options.policies?.show || [], show(model, options));
  }

  if (!options.readOnly) {
    if (declarableRoute('create', options)) {
      router.post('/', LoggerMiddleware, options.middleware?.create || [], options.policies?.create || [], create(model, options));
    }
    if (declarableRoute('update', options)) {
      router.patch('/:id', LoggerMiddleware, options.middleware?.update || [], options.policies?.update || [], update(model, options));
    }
    if (declarableRoute('delete', options)) {
      router.delete('/:id', LoggerMiddleware, options.middleware?.delete || [], options.policies?.delete || [], remove(model, options));
    }
  }
  return router;
}

function declarableRoute(type: ResourcifyActions, options: ResourcifyOptionsInterface = {}) {
  return !options.declareRouteFor || options.declareRouteFor.includes(type)
}