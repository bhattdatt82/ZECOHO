import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  Check,
} from "lucide-react";

type Step = "email" | "otp" | "newPassword" | "success";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpValue, setOtpValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendResetOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", {
        email,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setStep("otp");
      setCountdown(60);
      toast({
        title: "Reset Code Sent",
        description: `We've sent a 6-digit code to ${data.email}`,
      });
    },
    onError: (error: any) => {
      const isOtpAccount = error.message?.includes("different login method");
      toast({
        title: isOtpAccount
          ? "Use OTP Login Instead"
          : "Failed to send reset code",
        description: isOtpAccount
          ? "Your account uses OTP login. Please go back and use the OTP option to sign in."
          : error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      otp: string;
      newPassword: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/auth/reset-password",
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      setStep("success");
      toast({
        title: "Password Reset!",
        description: "Your password has been reset successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
      if (
        error.message?.includes("expired") ||
        error.message?.includes("Invalid")
      ) {
        setOtp(["", "", "", "", "", ""]);
        setOtpValue("");
        otpRefs.current[0]?.focus();
      }
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    sendResetOtpMutation.mutate(email.trim());
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit) && newOtp.join("").length === 6) {
      setOtpValue(newOtp.join(""));
      setStep("newPassword");
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      setOtpValue(pastedData);
      setStep("newPassword");
    }
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    sendResetOtpMutation.mutate(email);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ email, otp: otpValue, newPassword });
  };

  const getIcon = () => {
    switch (step) {
      case "email":
        return <Mail className="h-8 w-8 text-primary" />;
      case "otp":
        return <Shield className="h-8 w-8 text-primary" />;
      case "newPassword":
        return <KeyRound className="h-8 w-8 text-primary" />;
      case "success":
        return <Check className="h-8 w-8 text-primary" />;
    }
  };

  const getTitle = () => {
    switch (step) {
      case "email":
        return "Reset Your Password";
      case "otp":
        return "Enter Verification Code";
      case "newPassword":
        return "Create New Password";
      case "success":
        return "Password Reset!";
    }
  };

  const getDescription = () => {
    switch (step) {
      case "email":
        return "Enter your email address and we'll send you a code to reset your password.";
      case "otp":
        return `We've sent a 6-digit code to ${email}`;
      case "newPassword":
        return "Enter your new password below.";
      case "success":
        return "Your password has been reset successfully. You can now log in with your new password.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <Card className="w-full max-w-md" data-testid="card-forgot-password">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {getIcon()}
            </div>
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  data-testid="input-email"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={sendResetOtpMutation.isPending || !email.trim()}
                data-testid="button-send-reset-code"
              >
                {sendResetOtpMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reset Code
                  </>
                )}
              </Button>

              <div className="mt-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                    data-testid="link-login"
                  >
                    Back to Login
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  Signed up with OTP?{" "}
                  <Link
                    href="/login?method=otp"
                    className="text-primary hover:underline font-medium"
                  >
                    Login with OTP instead
                  </Link>
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setLocation("/")}
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </form>
          )}

          {step === "otp" && (
            <div className="space-y-6">
              <div
                className="flex justify-center gap-2"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold"
                    autoFocus={index === 0}
                    data-testid={`input-otp-${index}`}
                  />
                ))}
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  {countdown > 0 ? (
                    <span>Resend in {countdown}s</span>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={sendResetOtpMutation.isPending}
                      className="text-primary hover:underline font-medium"
                      data-testid="button-resend-otp"
                    >
                      Resend Code
                    </button>
                  )}
                </p>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep("email");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  data-testid="button-change-email"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Use Different Email
                </Button>
              </div>
            </div>
          )}

          {step === "newPassword" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    className="pr-10"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  resetPasswordMutation.isPending ||
                  !newPassword ||
                  !confirmPassword
                }
                data-testid="button-reset-password"
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("otp");
                  setOtp(["", "", "", "", "", ""]);
                  setOtpValue("");
                }}
                data-testid="button-back-to-otp"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setLocation("/login")}
                data-testid="button-go-to-login"
              >
                <Lock className="h-4 w-4 mr-2" />
                Go to Login
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-back-home-success"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
