import Message from '@/dtos/message.dto';
import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@/utils/logger';
import { messageResponse } from '@interfaces/common.interface';
import SMSProvider from './sms.provider.service';

export default class SMSLoadBalancer {
  private providers: SMSProvider[];
  private interval: number; // interval in minutes to calculate throughput
  public buffer: Message[]; // buffer to store and forward SMS if all providers are down

  constructor(providers: SMSProvider[], interval: number) {
    this.providers = providers;
    this.buffer = [];
    this.interval = interval;
  }

  public async sendSMSWithLoadBalancing(messages: Message[]): Promise<messageResponse> {
    const availableProviders: SMSProvider[] = this.providers.filter(provider => provider.isAvailable());
    // store and forward if all providers are down
    if (availableProviders.length === 0) {
      messages.forEach((message: Message) => {
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
    // send using available provider if only one is available
    if (availableProviders.length === 1) {
      const throughput: number = this.calculateThroughput();
      const provider: SMSProvider = availableProviders[0];
      const chunk: Message[] = messages.slice(0, throughput);
      //send maximum amount messages possible
      await provider.sendSMS(chunk);
      //store undelivered messages into buffer
      if (chunk.length < messages.length) {
        const remaining: Message[] = messages.slice(chunk.length, messages.length);
        remaining.forEach((message: Message) => {
          this.buffer.push(message);
        });
        throw new HttpException(
          503,
          JSON.stringify({
            totalMessages: messages.length,
            sent: chunk.length,
            unsent: messages.length - chunk.length,
            storedInBuffer: messages.length - chunk.length,
          }),
        );
      }
      return {
        totalMessages: messages.length,
        sent: chunk.length,
        unsent: messages.length - chunk.length,
        storedInBuffer: messages.length - chunk.length,
      };
    }
    //weighted round robin for load balancing between multiple provider
    let sentMessages: number = 0;
    availableProviders.forEach(async (provider: SMSProvider, index: number) => {
      const chunkSize: number = messages.length * (provider.getThroughputPerInterval(this.interval) / this.calculateThroughput());
      const startIndex: number = index * chunkSize;
      const endIndex: number = startIndex + chunkSize;
      const chunk: Message[] = messages.slice(startIndex, endIndex);
      sentMessages += chunk.length;
      //send maximum amount messages possible
      await provider.sendSMS(chunk);
    });
    //store undelivered messages into buffer
    if (sentMessages < messages.length) {
      const remaining: Message[] = messages.slice(sentMessages, messages.length);
      remaining.forEach((message: Message) => {
        this.buffer.push(message);
      });
      throw new HttpException(
        503,
        JSON.stringify({
          totalMessages: messages.length,
          sent: sentMessages,
          unsent: messages.length - sentMessages,
          storedInBuffer: messages.length - sentMessages,
        }),
      );
    }
    return {
      totalMessages: messages.length,
      sent: sentMessages,
      unsent: messages.length - sentMessages,
      storedInBuffer: messages.length - sentMessages,
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
