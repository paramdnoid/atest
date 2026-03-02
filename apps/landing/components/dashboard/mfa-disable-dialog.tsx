"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { acquireAccessToken, disableMfa } from "@/lib/mfa-api";

interface MfaDisableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MfaDisableDialog({ open, onOpenChange, onSuccess }: MfaDisableDialogProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("Bitte Code eingeben.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const accessToken = await acquireAccessToken();
      if (!accessToken) {
        setError("Sitzung abgelaufen. Bitte neu anmelden.");
        setPending(false);
        return;
      }

      // Detect code type: 6 digits = TOTP, otherwise = backup code
      const isTotpCode = /^\d{6}$/.test(code.trim());
      const result = await disableMfa(
        accessToken,
        isTotpCode ? code : null,
        !isTotpCode ? code : null
      );

      if ("error" in result) {
        setError(result.error);
        setPending(false);
        return;
      }

      toast.success("MFA wurde erfolgreich deaktiviert.");
      setCode("");
      setError("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "Ein Fehler ist aufgetreten.");
    } finally {
      setPending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCode("");
      setError("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Zwei-Faktor-Authentifizierung deaktivieren</DialogTitle>
          <DialogDescription>
            Geben Sie Ihren 6-stelligen Code oder einen Backup-Code ein, um die Zwei-Faktor-Authentifizierung zu deaktivieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            placeholder="6-stelliger Code oder Backup-Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !pending) {
                handleSubmit();
              }
            }}
            disabled={pending}
            autoComplete="off"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Abbrechen
          </Button>
          <LoadingButton onClick={handleSubmit} pending={pending} variant="destructive">
            MFA deaktivieren
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
