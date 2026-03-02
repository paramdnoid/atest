"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MfaSetupDialog } from "./mfa-setup-dialog";
import { MfaDisableDialog } from "./mfa-disable-dialog";

interface MfaSectionProps {
  initialMfaEnabled: boolean;
}

export function MfaSection({ initialMfaEnabled }: MfaSectionProps) {
  const [mfaEnabled, setMfaEnabled] = useState(initialMfaEnabled);
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  const handleSetupSuccess = () => {
    setMfaEnabled(true);
  };

  const handleDisableSuccess = () => {
    setMfaEnabled(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
              <CardDescription>Schützen Sie Ihr Konto mit einem zusätzlichen Sicherheitsschritt</CardDescription>
            </div>
            <Badge variant={mfaEnabled ? "default" : "secondary"} className="gap-2">
              {mfaEnabled ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Aktiv
                </>
              ) : (
                <>
                  <ShieldOff className="w-4 h-4" />
                  Inaktiv
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {mfaEnabled ? (
            <Button
              onClick={() => setDisableOpen(true)}
              variant="destructive"
            >
              MFA deaktivieren
            </Button>
          ) : (
            <Button
              onClick={() => setSetupOpen(true)}
              variant="default"
            >
              MFA aktivieren
            </Button>
          )}
        </CardContent>
      </Card>

      <MfaSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onSuccess={handleSetupSuccess}
      />
      <MfaDisableDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        onSuccess={handleDisableSuccess}
      />
    </>
  );
}
