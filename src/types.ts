import { Request, RequestHandler } from 'express';
import { FilterQuery, Model, PopulateOptions } from "mongoose";

export type ResourcifyRouteHandler = (model: Model<unknown>, options: ResourcifyOptionsInterface) => RequestHandler
export type ResourcifyActions = 'show' | 'index' | 'delete' | 'update' | 'create' | 'resource';


export interface ResourcifyOptionsInterface {
  policies?: {
    create?: RequestHandler | RequestHandler[]
    index?: RequestHandler | RequestHandler[]
    show?: RequestHandler | RequestHandler[]
    update?: RequestHandler | RequestHandler[]
    delete?: RequestHandler | RequestHandler[]
  }
  readOnly?: Boolean
  declareRouteFor?: Array<ResourcifyActions>
  populate?: {
    index?: PopulateOptions | PopulateOptions[];
    show?: PopulateOptions | PopulateOptions[];
    create?: PopulateOptions | PopulateOptions[];
    update?: string | PopulateOptions | PopulateOptions[];
  }
  query?: {
    index?(req: Request): FilterQuery<unknown>;
    show?(req: Request): FilterQuery<unknown>;
  }
  sort?: Record<string, 1 | -1>
  select?: Record<string, 1 | 0> | string[] | string
  pagination?: boolean
  middleware?: {
    create?: RequestHandler | RequestHandler[]
    index?: RequestHandler | RequestHandler[]
    show?: RequestHandler | RequestHandler[]
    update?: RequestHandler | RequestHandler[]
    delete?: RequestHandler | RequestHandler[]
  }
}
