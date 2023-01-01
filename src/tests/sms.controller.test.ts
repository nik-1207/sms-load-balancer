import SmsController from '../controllers/sms.controller';

describe('SmsController', () => {
  let smsController: SmsController;
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    smsController = new SmsController();
    req = { body: { messages: [] } };
    res = { send: jest.fn() };
    next = jest.fn();
  });

  describe('send', () => {
    it('should send the SMS messages and return the status', async () => {
      const expectedStatus = { success: true };
      const loadBalancer = { sendSMSWithLoadBalancing: jest.fn().mockReturnValue(expectedStatus) };
      smsController.loadBalancer = loadBalancer as any;

      await smsController.send(req, res, next);

      expect(loadBalancer.sendSMSWithLoadBalancing).toHaveBeenCalledWith(req.body.messages);
      expect(res.send).toHaveBeenCalledWith(expectedStatus);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with an error if sending the SMS messages fails', async () => {
      const expectedError = new Error('Failed to send SMS');
      const loadBalancer = {
        sendSMSWithLoadBalancing: jest.fn().mockImplementation(() => {
          throw expectedError;
        }),
      };
      smsController.loadBalancer = loadBalancer as any;

      await smsController.send(req, res, next);

      expect(loadBalancer.sendSMSWithLoadBalancing).toHaveBeenCalledWith(req.body.messages);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expectedError);
    });
  });
});
