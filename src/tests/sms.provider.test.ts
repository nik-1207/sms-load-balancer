import SMSProvider from '../services/sms.provider.service';
import Message from '../dtos/message.dto';

describe('SMSProvider', () => {
  let provider: SMSProvider;
  beforeEach(() => {
    provider = new SMSProvider('TestProvider', true, 100);
  });

  it('should return the provider name', () => {
    expect(provider.getProviderName()).toEqual('TestProvider');
  });

  it('should return the availability of the provider', () => {
    expect(provider.isAvailable()).toBe(true);
  });

  it('should return the throughput per interval', () => {
    expect(provider.getThroughputPerInterval(1)).toEqual(100);
  });

  it('should send an SMS', async () => {
    const messages: Message[] = [{ phoneNumber: '1234567890', text: 'Test message' }];

    const messageResponse = await provider.sendSMS(messages);

    expect(messageResponse).toBe(messages.length);
  });
});
