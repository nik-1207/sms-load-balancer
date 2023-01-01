import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@/middlewares/validation.middleware';
import SmsDto from '@/dtos/sms.dto';
import SmsController from '@/controllers/sms.controller';

class SmsRoute implements Routes {
  public path = '/sms';
  public router = Router();
  public smsController = new SmsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}`, validationMiddleware(SmsDto, 'body'), this.smsController.send);
  }
}

export default SmsRoute;
