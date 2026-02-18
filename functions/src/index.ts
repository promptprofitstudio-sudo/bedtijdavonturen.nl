import * as admin from 'firebase-admin';
import { partnerHunter } from './marketing/partnerHunter';
import { partnerHunterV4 } from './marketing/partnerHunterV4';
import { solarHunterV1 } from './marketing/solarHunterV1';
import { realtorHunterV1 } from './marketing/realtorHunterV1';
import { testPartnerFlow } from './marketing/testFlow';
import { checkExpiredTrials } from './cron/checkExpiredTrials';

admin.initializeApp();

export {
    partnerHunter,
    partnerHunterV4,
    solarHunterV1,
    realtorHunterV1,
    testPartnerFlow,
    checkExpiredTrials
};
