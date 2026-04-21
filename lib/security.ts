import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const passwordAlgorithm = "scrypt";
const sessionSecret = process.env.CHUNEUP_SESSION_SECRET ?? "chuneup-dev-session-secret";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${passwordAlgorithm}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHash] = storedHash.split(":");

  if (algorithm !== passwordAlgorithm || !salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64).toString("hex");
  return safeEqual(actualHash, expectedHash);
}

function signSession(payload: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

export function createSessionValue(userId: number, expiresAt: number) {
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${signSession(payload)}`;
}

export function verifySessionValue(sessionValue: string) {
  const [userIdText, expiresAtText, signature] = sessionValue.split(".");

  if (!userIdText || !expiresAtText || !signature) {
    return undefined;
  }

  const payload = `${userIdText}.${expiresAtText}`;
  const expectedSignature = signSession(payload);

  if (!safeEqual(signature, expectedSignature)) {
    return undefined;
  }

  const userId = Number(userIdText);
  const expiresAt = Number(expiresAtText);

  if (!Number.isInteger(userId) || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return undefined;
  }

  return { userId, expiresAt };
}
