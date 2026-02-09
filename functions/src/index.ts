import * as admin from 'firebase-admin';
import { partnerHunter } from './marketing/partnerHunter';
import { partnerHunterV4 } from './marketing/partnerHunterV4';
import { testPartnerFlow } from './marketing/testFlow';
import { checkExpiredTrials } from './cron/checkExpiredTrials';

admin.initializeApp();

export { partnerHunter, partnerHunterV4, checkExpiredTrials, testPartnerFlow };
