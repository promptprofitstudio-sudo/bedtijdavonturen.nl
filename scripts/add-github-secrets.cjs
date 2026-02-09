#!/usr/bin/env node

const nacl = require('tweetnacl');
const { encodeBase64 } = require('tweetnacl-util');

async function addGitHubSecret(token, repo, secretName, secretValue, publicKey, keyId) {
    // Encrypt the secret using libsodium
    const messageBytes = Buffer.from(secretValue);
    const keyBytes = Buffer.from(publicKey, 'base64');

    const encryptedBytes = nacl.seal(messageBytes, keyBytes);
    const encrypted = encodeBase64(encryptedBytes);

    // Upload the encrypted secret
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/secrets/${secretName}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            encrypted_value: encrypted,
            key_id: keyId
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to add secret ${secretName}: ${response.status} ${error}`);
    }

    return response.status === 201 || response.status === 204;
}

async function main() {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = 'promptprofitstudio-sudo/bedtijdavonturen.nl';

    // Get public key
    console.log('Fetching repository public key...');
    const keyResponse = await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/public-key`, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json'
        }
    });

    if (!keyResponse.ok) {
        throw new Error(`Failed to get public key: ${keyResponse.status}`);
    }

    const { key: publicKey, key_id: keyId } = await keyResponse.json();
    console.log(`✓ Got public key (ID: ${keyId})`);

    // Add secrets
    const secrets = {
        'NEXT_PUBLIC_STRIPE_PRICE_WEEKEND': 'price_1SvNvBJwBpgxJArJWbCTxQ1V',
        'NEXT_PUBLIC_STRIPE_PRICE_MONTHLY': 'price_1SvNvBJwBpgxJArJaa6upgiP',
        'NEXT_PUBLIC_STRIPE_PRICE_ANNUAL': 'price_1SvNvCJwBpgxJArJOjRVAXNt'
    };

    for (const [name, value] of Object.entries(secrets)) {
        console.log(`Adding secret: ${name}...`);
        await addGitHubSecret(GITHUB_TOKEN, REPO, name, value, publicKey, keyId);
        console.log(`✓ Added ${name}`);
    }

    console.log('\n✅ All Stripe secrets added successfully!');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
