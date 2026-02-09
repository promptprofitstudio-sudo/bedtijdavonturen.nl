#!/usr/bin/env ts-node

/**
 * Validate Instantly.ai Campaign Sequence vs V10.1 Spec
 * 
 * Checks:
 * - Number of emails (should be 5)
 * - Intervals (Day 0, 3, 6, 9, 14)
 * - Email #1 uses custom variables
 * - Emails #2-5 are static templates
 * - Stop on reply: Yes
 */

import axios from 'axios';
import { execSync } from 'child_process';

const PROJECT = 'bedtijdavonturen-prod';

// Fetch API key from GSM
function getSecret(name: string): string {
    return execSync(
        `gcloud secrets versions access latest --secret=${name} --project=${PROJECT}`,
        { encoding: 'utf-8' }
    ).trim();
}

const INSTANTLY_API_KEY = getSecret('INSTANTLY_API_KEY');
const CAMPAIGN_ID = getSecret('INSTANTLY_CAMPAIGN_KDV');

interface InstantlyCampaign {
    id: string;
    name: string;
    status: string;
    sequences: Array<{
        step: number;
        subject: string;
        body: string;
        delay_in_days: number;
    }>;
    settings: {
        stop_on_reply: boolean;
        stop_on_positive_reply: boolean;
        daily_limit: number;
    };
}

async function validateSequence() {
    console.log('📊 Validating Instantly Campaign Sequence\n');
    console.log(`Campaign ID: ${CAMPAIGN_ID}\n`);

    try {
        // Fetch specific campaign details (not the list endpoint)
        console.log('Fetching campaign details...\n');
        const response = await axios.get(
            `https://api.instantly.ai/api/v2/campaigns/${CAMPAIGN_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const campaign = response.data;
        console.log(`✅ Campaign Found: ${campaign.name || 'KDV Campaign'}\n`);

        // V10.1 Spec Requirements
        const V10_SPEC = {
            total_emails: 5,
            intervals: [0, 3, 6, 9, 14], // Days
            email1_vars: ['subject_a', 'subject_b', 'greeting', 'body', 'cta', 'closing', 'optout'],
            stop_on_reply: true
        };

        console.log('=== V10.1 Specification ===');
        console.log(`Total Emails: ${V10_SPEC.total_emails}`);
        console.log(`Intervals: Day ${V10_SPEC.intervals.join(', ')}`);
        console.log(`Email #1 Variables: ${V10_SPEC.email1_vars.join(', ')}`);
        console.log(`Stop on Reply: ${V10_SPEC.stop_on_reply}\n`);

        console.log('=== Current Configuration ===\n');

        // Check sequences - API structure is sequences[0].steps[]
        const sequenceSteps = campaign.sequences?.[0]?.steps || [];
        console.log(`Total Emails in Sequence: ${sequenceSteps.length}`);

        if (sequenceSteps.length !== V10_SPEC.total_emails) {
            console.log(`❌ MISMATCH: Expected ${V10_SPEC.total_emails} emails, found ${sequenceSteps.length}\n`);
        } else {
            console.log(`✅ Correct number of emails\n`);
        }

        // Check intervals
        console.log('Email Intervals:');
        const actualIntervals: number[] = [];
        sequenceSteps.forEach((step: any, idx: number) => {
            const delay = step.delay || 0;
            actualIntervals.push(delay);
            const expected = V10_SPEC.intervals[idx];
            const match = delay === expected ? '✅' : '❌';
            console.log(`  Step ${idx + 1}: ${delay} days ${match} (expected: ${expected})`);
        });
        console.log();

        // Check Email #1 for custom variables
        let foundVars: string[] = [];
        if (sequenceSteps.length > 0) {
            const email1 = sequenceSteps[0];
            const variants = email1.variants || [];

            console.log('Email #1 Template Check:');
            console.log(`Variants: ${variants.length}`);

            // Check all variants for custom variables
            const allFoundVars = new Set<string>();
            variants.forEach((variant: any) => {
                const subject = variant?.subject || '';
                const body = variant?.body || '';

                V10_SPEC.email1_vars.forEach(v => {
                    if (subject.includes(`{{${v}}}`) || body.includes(`{{${v}}}`)) {
                        allFoundVars.add(v);
                    }
                });
            });

            foundVars = Array.from(allFoundVars);

            console.log(`\nCustom Variables Found: ${foundVars.length}/${V10_SPEC.email1_vars.length}`);
            foundVars.forEach(v => console.log(`  ✅ {{${v}}}`));

            const missingVars = V10_SPEC.email1_vars.filter(v => !foundVars.includes(v));
            if (missingVars.length > 0) {
                console.log(`\nMissing Variables:`);
                missingVars.forEach(v => console.log(`  ❌ {{${v}}}`));
            }
            console.log();
        }

        // Check Email #2-5 (should be static)
        if (sequenceSteps.length > 1) {
            console.log('Emails #2-5 Preview:');
            sequenceSteps.slice(1).forEach((step: any, idx: number) => {
                const stepNum = idx + 2;
                const variant = step.variants?.[0];
                const subject = variant?.subject || 'N/A';
                const bodyPreview = (variant?.body || '').substring(0, 60).replace(/\n/g, ' ');
                console.log(`\n  Step ${stepNum} (Day ${step.delay || 0}):`);
                console.log(`    Subject: ${subject}`);
                console.log(`    Body: ${bodyPreview}...`);
            });
            console.log();
        }

        // Check settings
        console.log('Campaign Settings:');
        console.log(`  Stop on Reply: ${campaign.stop_on_reply === true ? '✅ Yes' : '❌ No'}`);
        console.log(`  Daily Limit: ${campaign.daily_limit || 'N/A'}`);
        console.log();

        // Final Validation Summary
        console.log('=== Validation Summary ===\n');

        const checks = {
            'Total Emails (5)': sequenceSteps.length === V10_SPEC.total_emails,
            'Correct Intervals': JSON.stringify(actualIntervals) === JSON.stringify(V10_SPEC.intervals),
            'Email #1 has variables': foundVars.length === V10_SPEC.email1_vars.length,
            'Stop on Reply enabled': campaign.stop_on_reply === true
        };

        Object.entries(checks).forEach(([check, pass]) => {
            console.log(`${pass ? '✅' : '❌'} ${check}`);
        });

        const allPassed = Object.values(checks).every(v => v);
        console.log();
        if (allPassed) {
            console.log('🎉 All checks PASSED - V10.1 compliant!');
        } else {
            console.log('⚠️  Some checks FAILED - Review needed');
        }

    } catch (error: any) {
        console.error('❌ Error validating campaign:', error.response?.data || error.message);
        process.exit(1);
    }
}

validateSequence();
