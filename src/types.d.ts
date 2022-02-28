import { Request, RequestHandler } from 'express';
import { FilterQuery, Model, PopulateOptions } from "mongoose";

export type ResourcifyRouteHandler<T = any> = (model: Model<T>, options: ResourcifyOptionsInterface) => RequestHandler
export type ResourcifyActions = 'show' | 'index' | 'delete' | 'update' | 'create' | 'resource';


export interface ResourcifyOptionsInterface {
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
