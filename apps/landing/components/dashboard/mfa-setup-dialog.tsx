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
  DialogFooter,
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
        setErrorMessage("Sitzung abgelaufen. Bitte neu anmelden.");
        setStep("error");
        return;
      }

      const userId = extractUserIdFromJwt(accessToken);
      if (!userId) {
        setErrorMessage("Authentifizierung fehlgeschlagen.");
        setStep("error");
        return;
      }

      const enrollmentData = await enableMfa(accessToken, userId);
      if ("error" in enrollmentData) {
        setErrorMessage(enrollmentData.error);
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

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen.");
    }
  };

  const handleCopyAllCodes = async () => {
    if (!enrollment) return;
    try {
      const allCodes = enrollment.backupCodes.join("\n");
      await navigator.clipboard.writeText(allCodes);
      toast.success("Alle Backup-Codes kopiert!");
    } catch {
      toast.error("Kopieren fehlgeschlagen.");
    }
  };

  const handleSuccess = () => {
    toast.success("MFA wurde erfolgreich aktiviert.");
    handleClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "loading" && (
          <>
            <DialogHeader>
              <DialogTitle>Zwei-Faktor-Authentifizierung einrichten</DialogTitle>
              <DialogDescription>Bitte warten, wir richten Ihre MFA ein...</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          </>
        )}

        {step === "error" && (
          <>
            <DialogHeader>
              <DialogTitle>Fehler beim Einrichten</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} variant="outline">
                Schließen
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "qr" && enrollment && (
          <>
            <DialogHeader>
              <DialogTitle>QR-Code scannen</DialogTitle>
              <DialogDescription>
                Scannen Sie diesen QR-Code mit Ihrer Authenticator-App (z. B. Google Authenticator, Authy).
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="p-4 bg-white rounded-lg">
                <QRCode value={enrollment.provisioningUri} size={192} level="M" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-2">Oder Code manuell eingeben:</p>
                <code className="block p-3 bg-gray-100 rounded text-sm font-mono text-center">
                  {enrollment.secret}
                </code>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep("backup")} className="gap-2">
                Weiter zu Backup-Codes
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "backup" && enrollment && (
          <>
            <DialogHeader>
              <DialogTitle>Backup-Codes</DialogTitle>
              <DialogDescription>
                Bewahren Sie diese Codes an einem sicheren Ort auf. Sie können einen Code verwenden, wenn Sie den Zugriff auf Ihre Authenticator-App verlieren.
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
            <DialogFooter>
              <Button onClick={handleCopyAllCodes} variant="outline">
                Alle kopieren
              </Button>
              <Button onClick={handleSuccess}>Fertig</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
