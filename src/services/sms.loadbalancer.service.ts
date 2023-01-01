import Message from '@/dtos/message.dto';
import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@/utils/logger';
import { debug } from 'console';
import SMSProvider from './sms.provider.service';

export default class SMSLoadBalancer {
  private providers: SMSProvider[];
  private interval: number; // interval in minutes to calculate throughput
  private buffer: Message[]; // buffer to store and forward SMS if all providers are down

  constructor(providers: SMSProvider[], interval: number) {
    this.providers = providers;
    this.buffer = [];
    this.interval = interval;
  }

  public async sendSMS(messages: Message[]) {
    const availableProviders = this.providers.filter(provider => provider.isAvailable());
    if (availableProviders.length === 0) {
      // store and forward if all providers are down
      messages.forEach(message => {
        this.buffer.push(message);
      });
      throw new HttpException(
        503,
        JSON.stringify({
          totalMessages: messages.length,
          sent: 0,
          unsent: messages.length,
          storedInBuffer: messages.length,
        }),
      );
    }
    if (availableProviders.length === 1) {
      // send using available provider if only one is available
      const throughput = this.calculateThroughput();
      const provider = availableProviders[0];
      const chunk = messages.slice(0, throughput);
      await provider.sendSMS(chunk);
      return {
        totalMessages: messages.length,
        sent: chunk,
        unsent: 0,
        storedInBuffer: 0,
      };
    }
    let totalSendMessage = 0;
    availableProviders.forEach(async (provider, index) => {
      const chunkSize = messages.length * (provider.getThroughputPerInterval(this.interval) / this.calculateThroughput());
      const startIndex = index * chunkSize;
      const endIndex = startIndex + chunkSize;
      const chunk = messages.slice(startIndex, endIndex);
      totalSendMessage = chunk.length;
      await provider.sendSMS(chunk);
    });
    return {
      totalMessages: messages.length,
      sent: totalSendMessage,
      unsent: 0,
      storedInBuffer: 0,
    };
  }

  private calculateThroughput(): number {
    let throughput = 0;
    this.providers.forEach(provider => {
      if (provider.isAvailable()) {
        throughput += provider.getThroughputPerInterval(this.interval);
      }
    });
    return throughput;
  }
}
