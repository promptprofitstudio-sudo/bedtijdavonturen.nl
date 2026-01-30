"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiredTrials = exports.partnerHunter = void 0;
const admin = require("firebase-admin");
const partnerHunter_1 = require("./marketing/partnerHunter");
Object.defineProperty(exports, "partnerHunter", { enumerable: true, get: function () { return partnerHunter_1.partnerHunter; } });
const checkExpiredTrials_1 = require("./cron/checkExpiredTrials");
Object.defineProperty(exports, "checkExpiredTrials", { enumerable: true, get: function () { return checkExpiredTrials_1.checkExpiredTrials; } });
admin.initializeApp();
//# sourceMappingURL=index.js.map