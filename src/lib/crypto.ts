// Simple symmetric encryption using Web Crypto API (AES-GCM)
// NOTE: In production, use a secure key management approach!

const ENCRYPTION_KEY = 'timeline-demo-key-1234'; // Must be 16 chars for AES-128

async function getKey() {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
        'raw',
        enc.encode(ENCRYPTION_KEY),
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
    );
}

// Derive a key from a password using PBKDF2
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    // Always convert salt to a plain Uint8Array
    const realSalt = new Uint8Array(Uint8Array.prototype.slice.call(salt, 0));
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: realSalt,
            iterations: 100_000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 128 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt with password, output: base64(salt + iv + ciphertext)
export async function encryptWithPassword(plainText: string, password: string): Promise<string> {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKeyFromPassword(password, salt);
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv
        },
        key,
        enc.encode(plainText)
    );
    // Combine salt + iv + encrypted data, then base64 encode
    const encryptedBytes = new Uint8Array(encrypted);
    const combined = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedBytes, salt.length + iv.length);
    return btoa(String.fromCharCode(...combined));
}

// Decrypt with password, input: base64(salt + iv + ciphertext)
export async function decryptWithPassword(encryptedB64: string, password: string): Promise<string> {
    const data = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const ciphertext = data.slice(28);
    const key = await deriveKeyFromPassword(password, salt);
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv
        },
        key,
        ciphertext
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
} 