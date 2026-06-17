import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, ShieldCheck, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

const ForgotPasswordScreen = () => {
    const navigate = useNavigate();
    const shouldReduceMotion = useReducedMotion();
    
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !newPassword || !confirmPassword) {
            toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }

        if (newPassword.length < 8) {
            toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const res = await authApi.resetPassword({ email, newPassword });
            
            if (res.success) {
                setIsSubmitted(true);
                toast({
                    title: "Success",
                    description: "Your password has been reset successfully.",
                });
            }
        } catch (error: any) {
            toast({
                title: "Reset Failed",
                description: error.message || "Could not reset password",
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
                    backgroundImage: "linear-gradient(120deg, #ffffff 0%, #e0f2fe 28%, #7dd3fc 55%, #ffffff 100%)",
                    backgroundSize: "200% 200%",
                }}
                animate={shouldReduceMotion ? undefined : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={shouldReduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
                className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12"
            >
                <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="mb-6 w-fit text-slate-700 hover:text-slate-900"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Button>

                <Card className="border border-white/60 bg-white/60 shadow-2xl backdrop-blur-md">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl">
                            {isSubmitted ? 'Reset Complete' : 'Forgot Password'}
                        </CardTitle>
                        <CardDescription>
                            {isSubmitted
                                ? 'Your password has been successfully updated.'
                                : 'Enter your email and a new password to reset your account.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {isSubmitted ? (
                            <div className="text-center space-y-6 py-4">
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <ShieldCheck className="h-8 w-8 text-green-600" />
                                </div>
                                <Button
                                    onClick={() => navigate("/login")}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Proceed to Login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="student@gmail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-slate-700 font-semibold text-sm">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="newPassword"
                                            type={showPasswords ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-sm">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="confirmPassword"
                                            type={showPasswords ? "text" : "password"}
                                            placeholder="Confirm your new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 bg-white text-slate-900 border-transparent focus-visible:border-sky-500 focus-visible:ring-sky-500 h-11 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="show"
                                        checked={showPasswords}
                                        onChange={() => setShowPasswords(!showPasswords)}
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <label htmlFor="show" className="text-xs font-medium text-slate-600 cursor-pointer">Show Passwords</label>
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordScreen;
