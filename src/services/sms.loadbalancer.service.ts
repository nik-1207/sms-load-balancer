import SMSProvider from './sms.provider.service';

export default class SMSLoadBalancer {
  private providers: SMSProvider[];
  private interval: number; // interval in minutes to calculate throughput
  private buffer: { [key: string]: string[] }; // buffer to store and forward SMS if all providers are down

  constructor(providers: SMSProvider[], interval: number) {
    this.providers = providers;
    this.buffer = {};
  }

  public async sendSMS(phoneNumbers: string[], texts: Array<string>) {
    const recipients = phoneNumbers.length;
    const throughput = this.calculateThroughput();
    const intervals = Math.ceil(recipients / throughput);
    const chunkSize = Math.floor(recipients / intervals);

    for (let i = 0; i < intervals; i++) {
      const startIndex = i * chunkSize;
      const endIndex = startIndex + chunkSize;
      const chunk = phoneNumbers.slice(startIndex, endIndex);
      await this.sendSMSChunk(chunk, texts);
    }
  }

  private async sendSMSChunk(phoneNumbers: string[], texts: Array<string>) {
    const availableProviders = this.providers.filter(provider => provider.isAvailable());

    if (availableProviders.length === 0) {
      // store and forward if all providers are down
      phoneNumbers.forEach((phoneNumber, index) => {
        if (!this.buffer[phoneNumber]) {
          this.buffer[phoneNumber] = [];
        }
        this.buffer[phoneNumber].push(texts[index]);
      });
      return;
    }

    if (availableProviders.length === 1) {
      // send using available provider if only one is available
      const provider = availableProviders[0];
      await provider.sendSMS(phoneNumbers, texts);
      return;
    }

    // load balance between available providers
    const chunkSize = Math.floor(phoneNumbers.length / availableProviders.length);

    availableProviders.forEach((provider, index) => {
      console.log('***************** ' + provider.getProviderName() + ' *****************');
      const startIndex = index * chunkSize;
      const endIndex = startIndex + chunkSize;
      const chunk = phoneNumbers.slice(startIndex, endIndex);
      provider.sendSMS(chunk, texts);
    });
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
