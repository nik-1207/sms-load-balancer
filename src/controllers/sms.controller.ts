import Message from '@/dtos/message.dto';
import { messageResponse } from '@/interfaces/common.interface';
import SMSLoadBalancer from '@/services/sms.loadbalancer.service';
import SMSProvider from '@/services/sms.provider.service';
import { NextFunction, Request, Response } from 'express';

class SmsController {
  private loadBalancer: SMSLoadBalancer = new SMSLoadBalancer(
    [new SMSProvider('Airtel', true, 100), new SMSProvider('JIO', true, 100), new SMSProvider('VI', true, 100)],
    1,
  );

  public send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messages: Message[] = req.body.messages;
      const messageStatus: messageResponse = await this.loadBalancer.sendSMS(messages);
      res.send(messageStatus);
    } catch (error) {
      next(error);
    }
  };
}

export default SmsController;
