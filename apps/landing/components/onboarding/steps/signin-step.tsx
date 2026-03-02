"use client";

import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";

type SigninValues = {
  email: string;
  password: string;
};

export function SigninStep({
  values,
  pending,
  onChangeValues,
  onSignin,
  onSkip,
}: {
  values: SigninValues;
  pending: boolean;
  onChangeValues: (values: SigninValues) => void;
  onSignin: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="signin-email">E-Mail</Label>
          <Input
            id="signin-email"
            type="email"
            value={values.email}
            onChange={(e) => onChangeValues({ ...values, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signin-password">Passwort</Label>
          <Input
            id="signin-password"
            type="password"
            value={values.password}
            onChange={(e) => onChangeValues({ ...values, password: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <LoadingButton
          onClick={onSignin}
          type="button"
          pending={pending}
          icon={LogIn}
          pendingText="Anmeldung..."
        >
          Anmelden
        </LoadingButton>
        <Button type="button" variant="outline" onClick={onSkip}>
          Ohne Login weiter
        </Button>
      </div>
    </div>
  );
}
