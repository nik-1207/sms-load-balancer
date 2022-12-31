import SMSLoadBalancer from '@/services/sms.loadbalancer.service';
import SMSProvider from '@/services/sms.provider.service';
import { NextFunction, Request, Response } from 'express';

class IndexController {
  private loadBalancer = new SMSLoadBalancer(
    [new SMSProvider('Airtel', true, 100), new SMSProvider('JIO', true, 200), new SMSProvider('VI', true, 200)],
    1,
  );

  public index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const phoneNumbers: Array<string> = req.body.phoneNumbers;
      const texts: Array<string> = req.body.texts;
      this.loadBalancer.sendSMS(phoneNumbers, texts);
      res.send('Ok');
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
