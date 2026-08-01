import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toDisplayError, type AppErrorDetails } from "./errorHandling";
import { useOnlineStatus } from "./useOnlineStatus";

const SESSION_KEY = "gym_app_session_token";
const PROFILE_KEY = "offline_profile_v1";

type AuthRole = "gym" | "member" | "superadmin";

type CachedProfile = {
  userId: Id<"users">;
  email: string;
  role: AuthRole;
  memberId?: Id<"members">;
  gymId?: Id<"gyms">;
  sessionExpiresAt: number;
  displayName: string;
};

function getCachedProfile(): CachedProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as CachedProfile) : null;
  } catch {
    return null;
  }
}

function saveCachedProfile(profile: CachedProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // no-op
  }
}

function clearCachedProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // no-op
  }
}

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
  const [cachedProfile, setCachedProfile] = useState<CachedProfile | null>(getCachedProfile);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = useOnlineStatus();

  const loginMutation = useMutation(api.authLegacy.login);
  const registerGymMutation = useMutation(api.authLegacy.registerGym);
  const verifyMemberInvitationMutation = useMutation(api.authLegacy.verifyMemberInvitation);
  const completeMemberOnboardingMutation = useMutation(api.authLegacy.completeMemberOnboarding);
  const logoutMutation = useMutation(api.authLegacy.logout);

  const me = useQuery(api.authLegacy.me, sessionToken ? { sessionToken } : "skip");

  useEffect(() => {
    if (me && sessionToken) {
      const profile: CachedProfile = {
        userId: me.userId,
        email: me.email,
        role: me.role as AuthRole,
        memberId: me.memberId,
        gymId: me.gymId,
        sessionExpiresAt: me.sessionExpiresAt,
        displayName: me.displayName,
      };
      setCachedProfile(profile);
      saveCachedProfile(profile);
    }
  }, [me, sessionToken]);

  useEffect(() => {
    if (!sessionToken) {
      setIsInitialized(true);
      return;
    }

    if (!isOnline) {
      if (cachedProfile && cachedProfile.sessionExpiresAt > Date.now()) {
        setIsInitialized(true);
        return;
      }
      setSessionToken(null);
      localStorage.removeItem(SESSION_KEY);
      clearCachedProfile();
      setCachedProfile(null);
      setIsInitialized(true);
      return;
    }

    if (me === undefined) {
      return;
    }

    if (!me) {
      setSessionToken(null);
      localStorage.removeItem(SESSION_KEY);
      clearCachedProfile();
      setCachedProfile(null);
    }

    setIsInitialized(true);
  }, [me, sessionToken, isOnline, cachedProfile]);

  const user = useMemo<AuthUser | null>(() => {
    if (!sessionToken) return null;
    const profile = me !== undefined ? me : cachedProfile;
    if (!profile) return null;
    return {
      userId: profile.userId,
      memberId: profile.memberId,
      gymId: profile.gymId,
      email: profile.email,
      role: profile.role as AuthRole,
      displayName: profile.displayName,
      sessionExpiresAt: profile.sessionExpiresAt,
      sessionToken,
    };
  }, [me, cachedProfile, sessionToken]);

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
    clearCachedProfile();
    setCachedProfile(null);
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
