#!/usr/bin/env python3
import base64
import os
import sys
import requests
from nacl import encoding, public

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO = 'promptprofitstudio-sudo/bedtijdavonturen.nl'

def encrypt_secret(public_key: str, secret_value: str) -> str:
    """Encrypt a secret using libsodium."""
    public_key_bytes = base64.b64decode(public_key)
    sealed_box = public.SealedBox(public.PublicKey(public_key_bytes))
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")

def add_secret(secret_name: str, secret_value: str):
    """Add or update a GitHub repository secret."""
    headers = {
        'Authorization': f'Bearer {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github+json'
    }
    
    # Get public key
    key_response = requests.get(
        f'https://api.github.com/repos/{REPO}/actions/secrets/public-key',
        headers=headers
    )
    key_response.raise_for_status()
    key_data = key_response.json()
    
    # Encrypt secret
    encrypted_value = encrypt_secret(key_data['key'], secret_value)
    
    # Upload secret
    secret_response = requests.put(
        f'https://api.github.com/repos/{REPO}/actions/secrets/{secret_name}',
        headers=headers,
        json={
            'encrypted_value': encrypted_value,
            'key_id': key_data['key_id']
        }
    )
    secret_response.raise_for_status()
    print(f'✓ Added {secret_name}')

def main():
    secrets = {
        'NEXT_PUBLIC_STRIPE_PRICE_WEEKEND': 'price_1SvNvBJwBpgxJArJWbCTxQ1V',
        'NEXT_PUBLIC_STRIPE_PRICE_MONTHLY': 'price_1SvNvBJwBpgxJArJaa6upgiP',
        'NEXT_PUBLIC_STRIPE_PRICE_ANNUAL': 'price_1SvNvCJwBpgxJArJOjRVAXNt'
    }
    
    for name, value in secrets.items():
        print(f'Adding {name}...')
        add_secret(name, value)
    
    print('\n✅ All Stripe secrets added successfully!')

if __name__ == '__main__':
    main()
