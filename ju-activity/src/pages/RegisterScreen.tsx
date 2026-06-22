import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, User, CreditCard, Mail, Lock, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";
import { ROUTES, ROLE_PATHS } from "@/constants/routes";
import { ROLES } from "@/constants/roles";
import { STORAGE_KEYS } from "@/constants/api";

const RegisterScreen = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character" };
    }
    return { valid: true, message: "" };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.studentId || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (formData.studentId.trim().length < 3) {
      toast({
        title: "Invalid Student ID",
        description: "Student ID must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = isStrongPassword(formData.password);
    if (!passwordValidation.valid) {
      toast({
        title: "Weak Password",
        description: passwordValidation.message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.register({
        name: formData.fullName.trim(),
        email: normalizedEmail,
        password: formData.password,
        studentId: formData.studentId.trim(),
      });

      if (result.success && result.user && result.token) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
        localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);

        toast({
          title: "Registration Success",
          description: "Welcome to JU Activity Hub! Your account has been created.",
        });

        const role = (result.user.role || ROLES.STUDENT) as keyof typeof ROLE_PATHS;
        navigate(ROLE_PATHS[role]?.DASHBOARD || ROUTES.STUDENT.DASHBOARD);
      }
    } catch (error: any) {
      let errorMessage = "Unable to register. Please try again.";

      if (error.message) {
        const errorMsgLower = error.message.toLowerCase();

        if (errorMsgLower.includes("already registered") || errorMsgLower.includes("already exists")) {
          if (errorMsgLower.includes("email")) {
            errorMessage = "This email is already registered. Please sign in instead.";
          } else if (errorMsgLower.includes("student id") || errorMsgLower.includes("id")) {
            errorMessage = "This Student ID is already registered. Please check and try again.";
          } else {
            errorMessage = "An account with this information already exists. Please sign in instead.";
          }
        } else if (errorMsgLower.includes("password")) {
          errorMessage = "Password requirements not met. Please check and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
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

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12"
      >
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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Register as a new student</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-700 font-semibold text-sm">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                    className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-slate-700 font-semibold text-sm">Student ID</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="studentId"
                    name="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="student@jazeerauniversity.edu.so"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use your university email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-sm">Confirm Password</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                  />
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
                {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                  <p className="text-xs text-green-600">Passwords match ✓</p>
                )}
              </div>

              <Button type="submit" className="w-full sm:col-span-2" size="lg" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Register'}
              </Button>
            </form>

            <div className="text-center text-muted-foreground mt-6">
              Already have an account?{' '}
              <Button
                variant="link"
                type="button"
                className="px-0 text-primary"
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                Sign in here
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterScreen;