import { Request, RequestHandler, Response, Router } from 'express';
import { Model } from "mongoose";
import { ResourcifyRouteHandler, ResourcifyOptionsInterface, ResourcifyActions } from './types';

const logger = console

function resposneError(req: Request, res: Response, err: Error | unknown) {
  if(err instanceof Error) {
    const statusCode = err.name && err.name === 'ValidationError' ? 422 : 500
    const message  = err && err.message ? err.message : String(err);
    const name = err && err.name ? err.name : 'ResourcifyServerError'
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

    logger.info("-> Resourcify index", req.originalUrl, req.params, req.query);
    req.body = req.body || {};
    const q = options.query && options.query.index ? await options.query.index(req) : {};

    Object.assign(q, req.body?.query || {});

    let find = model.find(q);
    const limit = +(req.body.limit || req.query.limit) || 50
    const offset = +(req.body.offset || req.query.offset) || 0
    if (options.pagination) {
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

    if (req.body.limit) {
      find = find.limit(parseInt(req.body.limit))
    }

    if (req.body.offset) {
      find = find.skip(parseInt(req.body.offset))
    }


    try {
      res.json(await find)
    } catch (err) {
      logger.error(err);
      resposneError(req, res, err);
    }
  };
}

const show: ResourcifyRouteHandler = (model, options = {}) => {

  return async (req, res) => {

    logger.info("-> Resourcify show", req.originalUrl, req.params, req.query);

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
      logger.error(err);
      resposneError(req, res, err);
    }
  }

};

const create: ResourcifyRouteHandler = (model, options = {}) => {

  return async (req, res) => {
    logger.info("-> Resourcify create", req.originalUrl, req.params, req.query);
    try {
      let item = await model.create(req.body);

      if (options.populate?.create) {
        item = await item.populate(options.populate.create)
      }
      res.status(201).json(item);
    } catch (err: any) {
      logger.error(err);
      resposneError(req, res, err);
    }
  }
};

const update: ResourcifyRouteHandler = (model, options = {}) => {

  return async (req, res) => {
    try {
      logger.info("-> Resourcify update", req.originalUrl, req.params, req.query);
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

const remove: ResourcifyRouteHandler = (model: Model<unknown>, options: ResourcifyOptionsInterface = {}) => {

  return async (req: Request, res: Response) => {
    try {
      logger.info("-> Resourcify delete", req.originalUrl, req.params, req.query);
      const deleted = await model.findOneAndRemove({ _id: req.params.id });
      res.status(deleted ? 204 : 404).end()
    } catch (err: any) {
      logger.error(err);
      resposneError(req, res, err);
    }
  }
};


export function resourcify(model: Model<unknown>, options: ResourcifyOptionsInterface = {}) {
  const router = Router()

  const LoggerMiddleware: RequestHandler = async (req, res, next) => {
    process.env.DEBUG && logger.info('~> request %s %s', req.method, req.originalUrl);
    next();
  }

  if (declarableRoute('index', options)) {
    router.get('/', LoggerMiddleware, options.middleware?.index || [], options.policies?.index || [], index(model, options));
  }

  router.post('/new', LoggerMiddleware, (req, res) => res.json(new model()));

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