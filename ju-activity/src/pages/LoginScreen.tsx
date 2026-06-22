import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";

const LoginScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isHydrated, user, login } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      const role = user?.role || "student";
      const path = role === "admin" ? ROUTES.ADMIN.DASHBOARD : role === "coordinator" ? ROUTES.COORDINATOR.DASHBOARD : ROUTES.STUDENT.DASHBOARD;
      navigate(path, { replace: true });
    }
  }, [isHydrated, isAuthenticated, navigate, user?.role]);

  if (!isHydrated) {
      return null;
  }

  // If already signed in, don't show login form
  if (isAuthenticated) {
    return null;
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);
    try {
      await login(normalizedEmail, password);

    } catch (error: any) {
      // Errors are handled inside login; any additional handling can be added here if needed.
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      {/* Animated skyblue/white gradient */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(120deg, #ffffff 0%, #e0f2fe 28%, #7dd3fc 55%, #ffffff 100%)",
          backgroundSize: "200% 200%",
        }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />

      {/* Soft floating blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-sky-300/50 blur-3xl"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.div
          className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-white/70 blur-3xl"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.06, 1] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 12, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.div
          className="absolute -bottom-28 left-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-400/40 blur-3xl"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 11, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </div>

      {/* Extra highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.HOME)}
          className="mb-6 w-fit text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="border border-white/60 bg-white/60 shadow-2xl backdrop-blur-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your JU-AMS account</CardDescription>

          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Button 
                  variant="link" 
                  type="button" 
                  className="px-0 text-primary"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                >
                  Forgot Password?
                </Button>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              {/* Register Link */}
              <p className="text-center text-muted-foreground">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  type="button"
                  className="px-0 text-primary"
                  onClick={() => navigate(ROUTES.REGISTER)}
                >
                  Register here
                </Button>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
