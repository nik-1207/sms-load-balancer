import { Router } from 'express';
import IndexController from '@controllers/index.controller';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@/middlewares/validation.middleware';
import { SmsDto } from '@/dtos/sms.dto';

class IndexRoute implements Routes {
  public path = '/sms';
  public router = Router();
  public indexController = new IndexController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, validationMiddleware(SmsDto), this.indexController.index);
  }
}

export default IndexRoute;
