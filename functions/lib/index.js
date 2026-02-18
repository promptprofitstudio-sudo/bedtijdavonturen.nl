"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiredTrials = exports.testPartnerFlow = exports.realtorHunterV1 = exports.solarHunterV1 = exports.partnerHunterV4 = exports.partnerHunter = void 0;
const admin = require("firebase-admin");
const partnerHunter_1 = require("./marketing/partnerHunter");
Object.defineProperty(exports, "partnerHunter", { enumerable: true, get: function () { return partnerHunter_1.partnerHunter; } });
const partnerHunterV4_1 = require("./marketing/partnerHunterV4");
Object.defineProperty(exports, "partnerHunterV4", { enumerable: true, get: function () { return partnerHunterV4_1.partnerHunterV4; } });
const solarHunterV1_1 = require("./marketing/solarHunterV1");
Object.defineProperty(exports, "solarHunterV1", { enumerable: true, get: function () { return solarHunterV1_1.solarHunterV1; } });
const realtorHunterV1_1 = require("./marketing/realtorHunterV1");
Object.defineProperty(exports, "realtorHunterV1", { enumerable: true, get: function () { return realtorHunterV1_1.realtorHunterV1; } });
const testFlow_1 = require("./marketing/testFlow");
Object.defineProperty(exports, "testPartnerFlow", { enumerable: true, get: function () { return testFlow_1.testPartnerFlow; } });
const checkExpiredTrials_1 = require("./cron/checkExpiredTrials");
Object.defineProperty(exports, "checkExpiredTrials", { enumerable: true, get: function () { return checkExpiredTrials_1.checkExpiredTrials; } });
admin.initializeApp();
//# sourceMappingURL=index.js.map