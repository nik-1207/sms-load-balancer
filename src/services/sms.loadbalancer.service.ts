import Message from '@/dtos/message.dto';
import { HttpException } from '@/exceptions/HttpException';
import { messageResponse } from '@interfaces/common.interface';
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

  public async sendSMS(messages: Message[]): Promise<messageResponse> {
    const availableProviders: SMSProvider[] = this.providers.filter(provider => provider.isAvailable());
    if (availableProviders.length === 0) {
      // store and forward if all providers are down
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
    if (availableProviders.length === 1) {
      // send using available provider if only one is available
      const throughput: number = this.calculateThroughput();
      const provider: SMSProvider = availableProviders[0];
      const chunk: Message[] = messages.slice(0, throughput);
      await provider.sendSMS(chunk);
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
    let totalSendMessage: number = 0;
    availableProviders.forEach(async (provider: SMSProvider, index: number) => {
      const chunkSize: number = messages.length * (provider.getThroughputPerInterval(this.interval) / this.calculateThroughput());
      const startIndex: number = index * chunkSize;
      const endIndex: number = startIndex + chunkSize;
      const chunk: Message[] = messages.slice(startIndex, endIndex);
      totalSendMessage += chunk.length;
      await provider.sendSMS(chunk);
    });
    if (totalSendMessage < messages.length) {
      const remaining: Message[] = messages.slice(totalSendMessage, messages.length);
      remaining.forEach((message: Message) => {
        this.buffer.push(message);
      });
      throw new HttpException(
        503,
        JSON.stringify({
          totalMessages: messages.length,
          sent: totalSendMessage,
          unsent: messages.length - totalSendMessage,
          storedInBuffer: messages.length - totalSendMessage,
        }),
      );
    }
    return {
      totalMessages: messages.length,
      sent: totalSendMessage,
      unsent: messages.length - totalSendMessage,
      storedInBuffer: messages.length - totalSendMessage,
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
