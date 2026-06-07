import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toDisplayError, type AppErrorDetails } from "./errorHandling";

const SESSION_KEY = "gym_app_session_token";

type AuthRole = "gym" | "member";

type AuthUser = {
  userId: Id<"users">;
  memberId?: Id<"members">;
  gymId?: Id<"gyms">;
  email: string;
  role: AuthRole;
  displayName: string;
  sessionExpiresAt: number;
  sessionToken: string;
};

type LoginInput = {
  role: AuthRole;
  email: string;
  password: string;
};

type VerifyMemberInvitationInput = {
  invitationCode: string;
  phone: string;
};

type CompleteMemberOnboardingInput = {
  invitationCode: string;
  phone: string;
  email: string;
  password: string;
};

type RegisterGymInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  description?: string;
};

type AuthResult = { success: true } | { success: false; error: AppErrorDetails };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  sessionToken: string | null;
  login: (input: LoginInput) => Promise<AuthResult>;
  verifyMemberInvitation: (input: VerifyMemberInvitationInput) => Promise<AuthResult & { memberName?: string }>;
  completeMemberOnboarding: (input: CompleteMemberOnboardingInput) => Promise<AuthResult>;
  registerGym: (input: RegisterGymInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
  return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(() => getStoredSessionToken());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = useMutation(api.authLegacy.login);
  const registerGymMutation = useMutation(api.authLegacy.registerGym);
  const verifyMemberInvitationMutation = useMutation(api.authLegacy.verifyMemberInvitation);
  const completeMemberOnboardingMutation = useMutation(api.authLegacy.completeMemberOnboarding);
  const logoutMutation = useMutation(api.authLegacy.logout);

  const me = useQuery(api.authLegacy.me, sessionToken ? { sessionToken } : "skip");

  useEffect(() => {
    if (!sessionToken) {
      setIsInitialized(true);
      return;
    }

    if (me === undefined) {
      return;
    }

    if (!me) {
      setSessionToken(null);
      localStorage.removeItem(SESSION_KEY);
    }

    setIsInitialized(true);
  }, [me, sessionToken]);

  const user = useMemo<AuthUser | null>(() => {
    if (!me) return null;
    return {
      userId: me.userId,
      memberId: me.memberId,
      gymId: me.gymId,
      email: me.email,
      role: me.role,
      displayName: me.displayName,
      sessionExpiresAt: me.sessionExpiresAt,
      sessionToken,
    };
  }, [me, sessionToken]);

  const login = useCallback(async (input: LoginInput): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await loginMutation({
        role: input.role,
        email: input.email.trim(),
        password: input.password,
      });

      setSessionToken(result.sessionToken);
      localStorage.setItem(SESSION_KEY, result.sessionToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: toDisplayError(error, {
          title: "Sign in failed",
          fallbackMessage: "Couldn't sign you in. Try again.",
        }),
      };
    } finally {
      setIsLoading(false);
    }
  }, [loginMutation]);

  const verifyMemberInvitation = useCallback(async (input: VerifyMemberInvitationInput): Promise<AuthResult & { memberName?: string }> => {
    setIsLoading(true);
    try {
      const result = await verifyMemberInvitationMutation({
        invitationCode: input.invitationCode.trim(),
        phone: input.phone.trim(),
      });

      return { success: true, memberName: result.memberName };
    } catch (error) {
      return {
        success: false,
        error: toDisplayError(error, {
          title: "Invitation check failed",
          fallbackMessage: "Couldn't verify the invitation. Try again.",
        }),
      };
    } finally {
      setIsLoading(false);
    }
  }, [verifyMemberInvitationMutation]);

  const completeMemberOnboarding = useCallback(async (input: CompleteMemberOnboardingInput): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await completeMemberOnboardingMutation({
        invitationCode: input.invitationCode.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        password: input.password,
      });

      setSessionToken(result.sessionToken);
      localStorage.setItem(SESSION_KEY, result.sessionToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: toDisplayError(error, {
          title: "Account setup failed",
          fallbackMessage: "Couldn't create your account. Try again.",
        }),
      };
    } finally {
      setIsLoading(false);
    }
  }, [completeMemberOnboardingMutation]);

  const registerGym = useCallback(async (input: RegisterGymInput): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await registerGymMutation({
        email: input.email.trim(),
        password: input.password,
        name: input.name.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        description: input.description?.trim() || undefined,
      });

      setSessionToken(result.sessionToken);
      localStorage.setItem(SESSION_KEY, result.sessionToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: toDisplayError(error, {
          title: "Gym registration failed",
          fallbackMessage: "Couldn't create your gym account. Try again.",
        }),
      };
    } finally {
      setIsLoading(false);
    }
  }, [registerGymMutation]);

  const logout = useCallback(async () => {
    const token = sessionToken;
    setSessionToken(null);
    localStorage.removeItem(SESSION_KEY);
    if (token) {
      try {
        await logoutMutation({ sessionToken: token });
      } catch {
        // no-op
      }
    }
  }, [logoutMutation, sessionToken]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isInitialized,
    isLoading,
    sessionToken,
    login,
    verifyMemberInvitation,
    completeMemberOnboarding,
    registerGym,
    logout,
  }), [user, isInitialized, isLoading, sessionToken, login, verifyMemberInvitation, completeMemberOnboarding, registerGym, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
