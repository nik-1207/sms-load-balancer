import SMSLoadBalancer from '../services/sms.loadbalancer.service';
import SMSProvider from '../services/sms.provider.service';
import Message from '../dtos/message.dto';
import { messageResponse } from '../interfaces/common.interface';
import { HttpException } from '../exceptions/HttpException';
import { faker } from '@faker-js/faker';

describe('SMSLoadBalancer', () => {
  let loadBalancer: SMSLoadBalancer;

  it('should store and forward if all providers are down', async () => {
    const provider1 = new SMSProvider('Provider1', false, 0);
    const provider2 = new SMSProvider('Provider2', false, 0);
    const provider3 = new SMSProvider('Provider3', false, 0);
    loadBalancer = new SMSLoadBalancer([provider1, provider2, provider3], 1);

    const messages: Message[] = [];
    for (let index = 0; index < 300; index++) {
      messages.push({
        phoneNumber: `${faker.phone.number('+91853404####')}`,
        text: `${faker.word.noun()}`,
      });
    }

    try {
      await loadBalancer.sendSMSWithLoadBalancing(messages);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.status).toEqual(503);
      expect(error.message).toEqual(
        JSON.stringify({
          totalMessages: 300,
          sent: 0,
          unsent: 300,
          storedInBuffer: 300,
        }),
      );
    }
  });

  it('should send all SMS with single provider', async () => {
    const provider1 = new SMSProvider('Provider1', true, 100);
    const provider2 = new SMSProvider('Provider2', false, 100);
    const provider3 = new SMSProvider('Provider3', false, 100);
    loadBalancer = new SMSLoadBalancer([provider1, provider2, provider3], 1);

    const messages: Message[] = [];
    for (let index = 0; index < 100; index++) {
      messages.push({
        phoneNumber: `${faker.phone.number('+91853404####')}`,
        text: `${faker.word.noun()}`,
      });
    }
    const result: messageResponse = await loadBalancer.sendSMSWithLoadBalancing(messages);
    expect(result).toEqual({
      totalMessages: 100,
      sent: 100,
      unsent: 0,
      storedInBuffer: 0,
    });
  });

  it('should send maximum SMS and store remaining in buffer with single provider', async () => {
    const provider1 = new SMSProvider('Provider1', true, 100);
    const provider2 = new SMSProvider('Provider2', false, 100);
    const provider3 = new SMSProvider('Provider3', false, 100);
    loadBalancer = new SMSLoadBalancer([provider1, provider2, provider3], 1);

    const messages: Message[] = [];
    for (let index = 0; index < 300; index++) {
      messages.push({
        phoneNumber: `${faker.phone.number('+91853404####')}`,
        text: `${faker.word.noun()}`,
      });
    }
    try {
      await loadBalancer.sendSMSWithLoadBalancing(messages);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.status).toEqual(503);
      expect(error.message).toEqual(
        JSON.stringify({
          totalMessages: 300,
          sent: 100,
          unsent: 200,
          storedInBuffer: 200,
        }),
      );
    }
  });

  it('should send SMS with load balancing with even throughput', async () => {
    const provider1 = new SMSProvider('Provider1', true, 100);
    const provider2 = new SMSProvider('Provider2', true, 100);
    const provider3 = new SMSProvider('Provider3', true, 100);
    loadBalancer = new SMSLoadBalancer([provider1, provider2, provider3], 1);

    const messages: Message[] = [];
    for (let index = 0; index < 300; index++) {
      messages.push({
        phoneNumber: `${faker.phone.number('+91853404####')}`,
        text: `${faker.word.noun()}`,
      });
    }
    const result: messageResponse = await loadBalancer.sendSMSWithLoadBalancing(messages);
    expect(result).toEqual({
      totalMessages: 300,
      sent: 300,
      unsent: 0,
      storedInBuffer: 0,
    });
  });
  
  it('should send SMS with load balancing with uneven throughput', async () => {
    const provider1 = new SMSProvider('Provider1', true, 200);
    const provider2 = new SMSProvider('Provider2', true, 200);
    const provider3 = new SMSProvider('Provider3', true, 100);
    loadBalancer = new SMSLoadBalancer([provider1, provider2, provider3], 1);

    const messages: Message[] = [];
    for (let index = 0; index < 300; index++) {
      messages.push({
        phoneNumber: `${faker.phone.number('+91853404####')}`,
        text: `${faker.word.noun()}`,
      });
    }
    const result: messageResponse = await loadBalancer.sendSMSWithLoadBalancing(messages);
    expect(result).toEqual({
      totalMessages: 300,
      sent: 300,
      unsent: 0,
      storedInBuffer: 0,
    });
  });

  it('should send maximum SMS with load balancing and store remaining in buffer', async () => {
    const provider1 = new SMSProvider('Provider1', true, 200);
    const provider2 = new SMSProvider('Provider2', true, 200);
    const provider3 = new SMSProvider('Provider3', true, 100);
    loadBalancer = new SMSLoadBalancer([provider1, provider2, provider3], 1);

    const messages: Message[] = [];
    for (let index = 0; index < 500; index++) {
      messages.push({
        phoneNumber: `${faker.phone.number('+91853404####')}`,
        text: `${faker.word.noun()}`,
      });
    }
    try {
      await loadBalancer.sendSMSWithLoadBalancing(messages);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.status).toEqual(503);
      expect(error.message).toEqual(
        JSON.stringify({
          totalMessages: 500,
          sent: 300,
          unsent: 200,
          storedInBuffer: 200,
        }),
      );
    }
  });
});
