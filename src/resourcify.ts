import { Router } from 'express';
import { Model } from 'mongoose';


const resourcify = (model: Model<unknown>) => {
  const router = Router()
  return router;
}

export default resourcify;