export type AppErrorDetails = {
  title: string;
  message: string;
  code?: string;
  requestId?: string;
  hint?: string;
  technical?: string;
};

const REQUEST_ID_REGEX = /\[Request ID:\s*([^\]]+)\]/i;

const HINTS_BY_CODE: Record<string, string> = {
  EMAIL_EXISTS: "Use a different email or sign in.",
  EMAIL_IN_USE: "This email is already taken.",
  ROLE_MISMATCH: "Switch account type and try again.",
  INVALID_PASSWORD: "Wrong password. Try again.",
  ACCOUNT_INCOMPLETE: "Contact support to finish setup.",
  MEMBER_NOT_FOUND: "Check the member code or use first-time access.",
  GYM_NOT_FOUND: "No gym found for this email.",
  INVALID_INVITATION: "Wrong invitation code. Try again.",
  INVITATION_EXPIRED: "Ask your gym for a new invite.",
  INVITATION_NOT_AVAILABLE: "Ask your gym for a new invite.",
  PHONE_MISMATCH: "Use the phone number from your invite.",
  UNAUTHORIZED: "Sign in again.",
  FORBIDDEN: "You can't do that.",
  INVALID_EMAIL: "Enter a valid email.",
  WEAK_PASSWORD: "Password must be at least 8 characters.",
  INVALID_INPUT: "Check your inputs and try again.",
  NO_ACTIVE_MEMBERSHIP: "Renew the member's plan first.",
  MEMBERSHIP_EXPIRED: "Renew the membership.",
  MEMBER_INACTIVE: "Reactivate the member first.",
};

function stripNoise(message: string): string {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("[CONVEX"))
    .filter((line) => !line.startsWith("Server Error"))
    .filter((line) => !line.startsWith("Uncaught ConvexError:"));

  if (lines.length === 0) return message.trim();
  return lines[lines.length - 1];
}

function parseConvexPayloadFromMessage(message: string): { code?: string; message?: string } | null {
  const marker = "ConvexError:";
  const index = message.indexOf(marker);
  if (index === -1) return null;

  const jsonStart = message.indexOf("{", index + marker.length);
  const jsonEnd = message.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

  try {
    const parsed = JSON.parse(message.slice(jsonStart, jsonEnd + 1)) as {
      code?: string;
      message?: string;
    };
    return parsed;
  } catch {
    return null;
  }
}

function normalizeUnknownError(error: unknown): {
  message?: string;
  code?: string;
  requestId?: string;
  technical?: string;
} {
  if (!error) return {};

  if (typeof error === "string") {
    const requestId = REQUEST_ID_REGEX.exec(error)?.[1];
    const payload = parseConvexPayloadFromMessage(error);
    return {
      message: payload?.message ?? stripNoise(error),
      code: payload?.code,
      requestId,
      technical: error,
    };
  }

  if (typeof error === "object") {
    const maybeWithData = error as {
      message?: string;
      data?: unknown;
    };

    if (maybeWithData.data && typeof maybeWithData.data === "object") {
      const data = maybeWithData.data as { code?: string; message?: string };
      const requestId = maybeWithData.message ? REQUEST_ID_REGEX.exec(maybeWithData.message)?.[1] : undefined;

      return {
        message: data.message ?? maybeWithData.message,
        code: data.code,
        requestId,
        technical: maybeWithData.message,
      };
    }

    if (maybeWithData.message) {
      const requestId = REQUEST_ID_REGEX.exec(maybeWithData.message)?.[1];
      const payload = parseConvexPayloadFromMessage(maybeWithData.message);

      return {
        message: payload?.message ?? stripNoise(maybeWithData.message),
        code: payload?.code,
        requestId,
        technical: maybeWithData.message,
      };
    }
  }

  return {};
}

export function toDisplayError(error: unknown, options: { title: string; fallbackMessage: string }): AppErrorDetails {
  const normalized = normalizeUnknownError(error);
  const message = normalized.message?.trim() || options.fallbackMessage;
  const code = normalized.code?.trim();

  return {
    title: options.title,
    message,
    code,
    requestId: normalized.requestId,
    hint: code ? HINTS_BY_CODE[code] : undefined,
    technical: normalized.technical,
  };
}
