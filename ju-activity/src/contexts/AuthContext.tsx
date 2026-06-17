import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { authApi, setTokenProvider, usersApi } from "@/lib/api";

export type UserRole = "student" | "coordinator" | "admin";




export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  avatar?: string;
  department?: string;
  joinedAt?: string; // ISO date string
  status?: "active" | "inactive";
}

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Provides the current user session, authentication state, and user management methods.
 *  Hydrates from localStorage on mount and verifies the token with the server. */export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]); // simplified for now
  const [isHydrated, setIsHydrated] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("anonymous");

  /** Hydrate the session from localStorage on mount. Verifies the stored token with the backend. */
  useEffect(() => {
    setTokenProvider(async () => {
      return localStorage.getItem('token');
    });

    const loadUserFromStorage = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          
          // Prefer server-verified session when token exists
          if (storedToken) {
            try {
              const me = await authApi.me();
              if (me?.success && me.user) {
                setUser(me.user);
                localStorage.setItem('user', JSON.stringify(me.user));
                setAuthState("authenticated");
              } else {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setUser(null);
                setAuthState("anonymous");
              }
            } catch (e) {
              console.warn("Failed to verify token with backend:", e);
              setUser(parsedUser);
              setAuthState("authenticated");
            }
          } else {
            // No token yet (legacy). Keep the stored user, but treat as authenticated.
            setUser(parsedUser);
            setAuthState("authenticated");
          }
        } else {
          setUser(null);
          setAuthState("anonymous");
        }
      } catch (e) {
        toast({ title: "Session Error", description: "Failed to restore your session. Please log in again.", variant: "destructive" });
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setAuthState("anonymous");
      } finally {
        setIsHydrated(true);
      }
    };

    loadUserFromStorage();
  }, []);

  /** Re-fetch the full user list from the backend (admin-only). */
  const refreshUsers = async () => {
     // Only attempt fetch when we actually have an auth token to send
     const token = localStorage.getItem('token');
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

  /** Auto-fetch users for admin on mount. */
  useEffect(() => {
    if (user?.role === 'admin') {
        refreshUsers();
    }
  }, [user]);

  /** Login a user – updates context, stores token/user, and sets auth state. */
  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login(email.trim().toLowerCase(), password);
      if (result.success && result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        if (result.token) {
          localStorage.setItem('token', result.token);
        }
        setUser(result.user);
        setAuthState("authenticated");
        // Navigate to appropriate dashboard based on role
        const role = result.user.role || "student";
        if (role === "admin") {
          navigate('/admin/dashboard');
        } else if (role === "coordinator") {
          navigate('/coordinator/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        toast({ title: "Login Failed", description: "Invalid credentials", variant: "destructive" });
        throw new Error("Login failed");
      }
    } catch (e) {
      toast({ title: "Login Error", description: (e as Error).message, variant: "destructive" });
      throw e;
    }
  };

  /** Clear the session from state and localStorage, then redirect to landing. */
  const logout = async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setAuthState("anonymous");
    navigate('/');
  };

  /** Permanently delete a user account by ID (admin only). */
  const deleteUser = async (userId: string) => {
      await usersApi.delete(userId);
      await refreshUsers();
  };

  /** Create a new coordinator account (admin only). */
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
      role: 'coordinator',
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

  /** Update the current user's profile (name, email, avatar, etc.). */
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
         localStorage.setItem('user', JSON.stringify(newUser));
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
