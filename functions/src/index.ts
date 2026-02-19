import * as admin from 'firebase-admin';
import { checkExpiredTrials } from './cron/checkExpiredTrials';

admin.initializeApp();

export {
    checkExpiredTrials
};
