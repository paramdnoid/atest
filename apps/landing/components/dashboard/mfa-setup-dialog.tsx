"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  acquireAccessToken,
  extractUserIdFromJwt,
  enableMfa,
  MfaEnrollment,
} from "@/lib/mfa-api";

type Step = "loading" | "error" | "qr" | "backup";

interface MfaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MfaSetupDialog({ open, onOpenChange, onSuccess }: MfaSetupDialogProps) {
  const [step, setStep] = useState<Step>("loading");
  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open || step !== "loading") return;

    const initEnrollment = async () => {
      const accessToken = await acquireAccessToken();
      if (!accessToken) {
        setErrorMessage("Failed to acquire access token");
        setStep("error");
        return;
      }

      const userId = extractUserIdFromJwt(accessToken);
      if (!userId) {
        setErrorMessage("Failed to extract user ID from token");
        setStep("error");
        return;
      }

      const enrollmentData = await enableMfa(accessToken, userId);
      if (!enrollmentData) {
        setErrorMessage("Failed to enable MFA");
        setStep("error");
        return;
      }

      setEnrollment(enrollmentData);
      setStep("qr");
    };

    initEnrollment();
  }, [open, step]);

  const handleClose = () => {
    setStep("loading");
    setEnrollment(null);
    setErrorMessage("");
    setCopiedIndex(null);
    onOpenChange(false);
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAllCodes = () => {
    if (!enrollment) return;
    const allCodes = enrollment.backupCodes.join("\n");
    navigator.clipboard.writeText(allCodes);
    toast.success("All backup codes copied!");
  };

  const handleSuccess = () => {
    toast.success("MFA enabled successfully!");
    handleClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "loading" && (
          <>
            <DialogHeader>
              <DialogTitle>Setting up 2FA</DialogTitle>
              <DialogDescription>Please wait while we generate your setup...</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          </>
        )}

        {step === "error" && (
          <>
            <DialogHeader>
              <DialogTitle>Setup Error</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </>
        )}

        {step === "qr" && enrollment && (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="p-4 bg-white rounded-lg">
                <QRCode value={enrollment.provisioningUri} size={192} level="M" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2">Or enter this code manually:</p>
                <code className="block p-3 bg-gray-100 rounded text-sm font-mono text-center">
                  {enrollment.secret}
                </code>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setStep("backup")} className="gap-2">
                Continue to Backup Codes
              </Button>
            </div>
          </>
        )}

        {step === "backup" && enrollment && (
          <>
            <DialogHeader>
              <DialogTitle>Backup Codes</DialogTitle>
              <DialogDescription>
                Save these codes in a safe place. You can use one code if you lose access to your authenticator.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="grid grid-cols-2 gap-3">
                {enrollment.backupCodes.map((code, index) => (
                  <button
                    key={index}
                    onClick={() => handleCopyCode(code, index)}
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-sm font-mono text-left transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{code}</span>
                      {copiedIndex === index && <span className="text-green-600 text-xs">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <Button onClick={handleCopyAllCodes} variant="outline">
                Copy All
              </Button>
              <Button onClick={handleSuccess}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
