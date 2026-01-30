import * as admin from 'firebase-admin';
import { partnerHunter } from './marketing/partnerHunter';
import { checkExpiredTrials } from './cron/checkExpiredTrials';

admin.initializeApp();

export { partnerHunter, checkExpiredTrials };
