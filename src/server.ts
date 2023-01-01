import 'reflect-metadata';
import App from '@/app';
import SmsRoute from '@/routes/sms.route';
import validateEnv from '@utils/validateEnv';

validateEnv();

const app = new App([new SmsRoute()]);

app.listen();
