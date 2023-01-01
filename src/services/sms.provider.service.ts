import Message from '@/dtos/message.dto';
import { logger } from '@/utils/logger';

export default class SMSProvider {
  private name: string;
  private availability: boolean;

  // throughput in SMS per minute
  private throughput: number;

  constructor(name: string, availability: boolean, throughput: number) {
    this.name = name;
    this.availability = availability;
    this.throughput = throughput;
  }

  public isAvailable(): boolean {
    return this.availability;
  }

  public getThroughputPerInterval(interval: number): number {
    return this.throughput * interval;
  }

  public async sendSMS(messages: Message[]): Promise<number> {
    // logger.info(`${messages.length}------------${this.name}`);
    return messages.length;
  }
  public getProviderName = (): string => {
    return this.name;
  };
}
