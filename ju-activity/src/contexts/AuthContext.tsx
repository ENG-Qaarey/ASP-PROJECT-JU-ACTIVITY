import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { authApi, usersApi } from "@/lib/api";
import { User } from "@/types/api";
import { ROLES } from "@/constants/roles";
import { STORAGE_KEYS } from "@/constants/api";
import { ROUTES, ROLE_PATHS } from "@/constants/routes";

export type AuthState =
  | "anonymous"
  | "authenticated";

/** Everything exposed by the auth provider — current user, user list, session management. */
export interface AuthContextType {
  /** Currently authenticated user, or null if anonymous. */
  user: User | null;
  /** All registered users (populated for admin role). */
  users: User[];
  /** Admin: permanently remove a user account. */
  deleteUser: (userId: string) => Promise<void>;
  /** Admin: create a new coordinator account. */
  createCoordinator: (data: {
    fullName: string;
    email: string;
    password: string;
    department?: string;
  }) => Promise<void>;
  /** Clear the session and redirect to the landing page. */
  logout: () => Promise<void>;
  /** Update the current user's password. */
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  /** Update the current user's profile (name, email, avatar, etc.). */
  updateProfile: (updates: {
    name: string;
    email: string;
    department?: string;
    studentId?: string;
    avatar?: string | File;
  }) => Promise<void>;
  /** Admin: toggle a user between active/inactive. */
  toggleUserStatus: (userId: string) => Promise<void>;
  /** Re-fetch the user list from the server. */
  refreshUsers: () => Promise<void>;
  /** Login a user with email/password – updates context and localStorage. */
  login: (email: string, password: string) => Promise<void>;
  
  /** True when a user session is active. */
  isAuthenticated: boolean;
  /** False while the stored session is still being loaded. */
  isHydrated: boolean;
  /** Current authentication state machine value. */
  authState: AuthState;
  /** True if backend is currently down/unreachable. */
  backendIsDown: boolean;
  /** Incremented each time backend comes back online, for triggering reconnection. */
  backendRestoreCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Provides the current user session, authentication state, and user management methods.
 *  Hydrates from localStorage on mount and verifies the token with the server. */export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]); // simplified for now
  const [isHydrated, setIsHydrated] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("anonymous");
  const [backendIsDown, setBackendIsDown] = useState(false);
  const [backendRestoreCount, setBackendRestoreCount] = useState(0);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          setAuthState("authenticated");
        } else {
          setUser(null);
          setAuthState("anonymous");
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        setUser(null);
        setAuthState("anonymous");
      } finally {
        setIsHydrated(true);
      }
    };

    loadUserFromStorage();
  }, []);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return;
      try {
        const result = await authApi.refresh(refreshToken);
        if (result?.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
        }
        if (result?.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
        }
      } catch {
        /* token expired — next real API call will handle 401 */
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const refreshUsers = async () => {
     const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
     if (!token) {
       console.warn("Skipping admin user sync: missing auth token");
       return;
     }
     try {
       const all = await usersApi.getAll(undefined, token);
       setUsers(all);
     } catch (e) {
       console.warn("Could not fetch users from backend", e);
     }
  };
 
  useEffect(() => {
    if (user?.role === ROLES.ADMIN) {
        refreshUsers();
    }
  }, [user]);

  /** Detect when the backend is down (network errors) */
  useEffect(() => {
    // Listen for network errors on the window
    const handleError = () => {
      // If we were authenticated and requests start failing, mark backend as down
      if (authState === "authenticated") {
        setBackendIsDown(true);
      }
    };

    window.addEventListener("offline", handleError);
    return () => window.removeEventListener("offline", handleError);
  }, [authState]);

  /** Poll the backend every 3s while it's down; on recovery, increment backendRestoreCount. */
  useEffect(() => {
    if (!backendIsDown) return;

    const checkBackend = async () => {
      try {
        const me = await authApi.me();
        if (me?.success && me.user) {
          setBackendIsDown(false);
          setBackendRestoreCount(c => c + 1);
          setUser(me.user);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(me.user));
          toast({ title: "Connection Restored", description: "Backend is back online! Refreshing data..." });
          if (me.user.role === ROLES.ADMIN) {
            refreshUsers();
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "";
        // If session expired (401), try refreshing the token
        if (errorMessage.includes("Session expired")) {
          const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (storedRefreshToken) {
            try {
              const refreshResult = await authApi.refresh(storedRefreshToken);
              if (refreshResult.success && refreshResult.token) {
                localStorage.setItem(STORAGE_KEYS.TOKEN, refreshResult.token);
                if (refreshResult.refreshToken) {
                  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshResult.refreshToken);
                }
                const me = await authApi.me();
                if (me?.success && me.user) {
                  setBackendIsDown(false);
                  setBackendRestoreCount(c => c + 1);
                  setUser(me.user);
                  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(me.user));
                  toast({ title: "Connection Restored", description: "Backend is back online! Session refreshed." });
                  if (me.user.role === ROLES.ADMIN) {
                    refreshUsers();
                  }
                }
                return;
              }
            } catch {
              // Refresh failed too
            }
          }

          // Could not refresh - clear session
          setBackendIsDown(false);
          setUser(null);
          setAuthState("anonymous");
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
        }
      }
    };

    const id = window.setInterval(checkBackend, 3000);
    return () => clearInterval(id);
  }, [backendIsDown]);

  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login(email.trim().toLowerCase(), password);
      if (result.success && result.user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
        if (result.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
        }
        if (result.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
        }
        setUser(result.user);
        setAuthState("authenticated");
        const role = result.user.role || ROLES.STUDENT;
        const routeMap: Record<string, string> = {
          [ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
          [ROLES.COORDINATOR]: ROUTES.COORDINATOR.DASHBOARD,
          [ROLES.STUDENT]: ROUTES.STUDENT.DASHBOARD,
        };
        navigate(routeMap[role] || ROUTES.STUDENT.DASHBOARD);
      } else {
        toast({ title: "Login Failed", description: "Invalid credentials", variant: "destructive" });
        throw new Error("Login failed");
      }
    } catch (e) {
      toast({ title: "Login Error", description: (e as Error).message, variant: "destructive" });
      throw e;
    }
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    setUser(null);
    setAuthState("anonymous");
    navigate(ROUTES.HOME);
  };

  /** Permanently delete a user account by ID (admin only). */
  const deleteUser = async (userId: string) => {
      await usersApi.delete(userId);
      await refreshUsers();
  };

  const createCoordinator = async (data: {
    fullName: string;
    email: string;
    password: string;
    department?: string;
  }) => {
    await usersApi.create({
      name: data.fullName,
      email: data.email,
      password: data.password,
      role: ROLES.COORDINATOR,
      department: data.department,
    });
    await refreshUsers();
  };

  /** Change the current user's password. */
  const changePassword = async (oldPassword: string, newPassword: string) => {
     if (!user) {
       throw new Error("You must be logged in to change your password.");
     }
      await usersApi.updateMyPassword(oldPassword, newPassword);
  };

  const updateProfile = async (updates: {
    name: string;
    email: string;
    department?: string;
    studentId?: string;
    avatar?: string | File;
  }) => {
      if (!user) {
        throw new Error("You must be logged in to update your profile.");
      }
      try {
         const { avatar, ...backendUpdates } = updates;
         const updatedUser = await usersApi.updateMe(backendUpdates);
         let updatedAfterAvatar = updatedUser;
         if (avatar instanceof File) {
           updatedAfterAvatar = await usersApi.uploadMyAvatar(avatar);
         }
         const newUser: User = {
           ...user,
           ...updatedAfterAvatar,
         };
         setUser(newUser);
         localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      } catch(e) {
          toast({ title: "Update Failed", description: "Could not update your profile. Please try again.", variant: "destructive" });
          throw e;
      }
  };
  
  /** Toggle a user between active/inactive status (admin only). */
  const toggleUserStatus = async (userId: string) => {
      await usersApi.toggleStatus(userId);
      await refreshUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: authState === "authenticated",
        isHydrated,
        authState,
        login,
        logout,
        deleteUser,
        createCoordinator,
        changePassword,
        updateProfile,
        toggleUserStatus,
        refreshUsers,
        backendIsDown,
        backendRestoreCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
