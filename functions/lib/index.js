"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPartnerFlow = exports.checkExpiredTrials = exports.partnerHunter = void 0;
const admin = require("firebase-admin");
const partnerHunter_1 = require("./marketing/partnerHunter");
Object.defineProperty(exports, "partnerHunter", { enumerable: true, get: function () { return partnerHunter_1.partnerHunter; } });
const testFlow_1 = require("./marketing/testFlow");
Object.defineProperty(exports, "testPartnerFlow", { enumerable: true, get: function () { return testFlow_1.testPartnerFlow; } });
const checkExpiredTrials_1 = require("./cron/checkExpiredTrials");
Object.defineProperty(exports, "checkExpiredTrials", { enumerable: true, get: function () { return checkExpiredTrials_1.checkExpiredTrials; } });
admin.initializeApp();
//# sourceMappingURL=index.js.map