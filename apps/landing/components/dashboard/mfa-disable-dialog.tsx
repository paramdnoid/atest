"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
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
      setError("Code is required");
      return;
    }

    setPending(true);
    setError("");

    try {
      const accessToken = await acquireAccessToken();
      if (!accessToken) {
        setError("Failed to acquire access token");
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

      toast.success("MFA disabled successfully");
      setCode("");
      setError("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "An error occurred");
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
          <DialogTitle>Disable 2FA</DialogTitle>
          <DialogDescription>
            Enter your 6-digit code or a backup code to disable two-factor authentication.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            placeholder="Enter 6-digit code or backup code"
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
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleOpenChange(false)}
            disabled={pending}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <LoadingButton onClick={handleSubmit} pending={pending} variant="destructive">
            Disable MFA
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
