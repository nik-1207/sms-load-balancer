import Message from '@/dtos/message.dto';
import { logger } from '@/utils/logger';
import { num } from 'envalid';

export default class SMSProvider {
  private name: string;
  private availability: boolean;
  private throughput: number; // throughput in SMS per minute

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

  public async sendSMS(message: Message[]) {
    logger.info(`${message.length}------------${this.name}`);
  }
  public getProviderName = () => this.name;
}
