import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Mail, ArrowLeft, Loader2, CheckCircle2, Shield } from "lucide-react";

type LoginStep = "email" | "otp";

export default function OtpLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/send-otp", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setStep("otp");
      setCountdown(60);
      toast({
        title: "OTP Sent",
        description: `We've sent a 6-digit code to ${data.email}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", { email, otp });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to ZECOHO!",
        description: "You have successfully logged in.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired OTP",
        variant: "destructive",
      });
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    sendOtpMutation.mutate(email);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit) && newOtp.join("").length === 6) {
      verifyOtpMutation.mutate({ email, otp: newOtp.join("") });
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      verifyOtpMutation.mutate({ email, otp: pastedData });
    }
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    sendOtpMutation.mutate(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <Card className="w-full max-w-md" data-testid="card-otp-login">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {step === "email" ? (
                <Mail className="h-8 w-8 text-primary" />
              ) : (
                <Shield className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === "email" ? "Login to ZECOHO" : "Enter Verification Code"}
          </CardTitle>
          <CardDescription>
            {step === "email" 
              ? "Enter your email to receive a one-time password"
              : `We've sent a 6-digit code to ${email}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
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
                disabled={sendOtpMutation.isPending || !email.trim()}
                data-testid="button-send-otp"
              >
                {sendOtpMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send OTP
                  </>
                )}
              </Button>
              
              <div className="text-center pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/")}
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
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
                    disabled={verifyOtpMutation.isPending}
                    autoFocus={index === 0}
                    data-testid={`input-otp-${index}`}
                  />
                ))}
              </div>

              {verifyOtpMutation.isPending && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </div>
              )}

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  {countdown > 0 ? (
                    <span>Resend in {countdown}s</span>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="text-primary hover:underline font-medium"
                      data-testid="button-resend-otp"
                    >
                      Resend OTP
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
                  Change Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
