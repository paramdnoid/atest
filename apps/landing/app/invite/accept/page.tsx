"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";

import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { GlowBackground } from "@/components/glow-background";

const GENERIC_ERROR_MESSAGE =
  "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";

type State = "loading" | "success" | "error";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Ungültiger Einladungslink.");
      return;
    }

    fetchApi("/v1/team/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setState("success");
          setMessage(data.message || "Einladung erfolgreich angenommen!");
        } else {
          setState("error");
          setMessage(
            data.error || "Die Einladung konnte nicht angenommen werden."
          );
        }
      })
      .catch(() => {
        setState("error");
        setMessage(GENERIC_ERROR_MESSAGE);
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        {state === "loading" && (
          <>
            <div className="flex justify-center">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                <Loader2 className="text-primary h-6 w-6 animate-spin" />
              </div>
            </div>
            <CardTitle className="text-lg">
              Einladung wird verarbeitet...
            </CardTitle>
            <CardDescription>
              Bitte warte einen Moment.
            </CardDescription>
          </>
        )}

        {state === "success" && (
          <>
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <CardTitle className="text-lg">Einladung angenommen</CardTitle>
            <CardDescription>{message}</CardDescription>
          </>
        )}

        {state === "error" && (
          <>
            <div className="flex justify-center">
              <div className="bg-destructive/15 flex h-12 w-12 items-center justify-center rounded-full">
                <XCircle className="text-destructive h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-lg">Fehler</CardTitle>
            <CardDescription className="text-destructive">
              {message}
            </CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-3">
        {state === "success" && (
          <Button asChild className="w-full">
            <Link href="/login">
              <Mail className="h-4 w-4" />
              Zum Login
            </Link>
          </Button>
        )}

        {state === "error" && (
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Zur Startseite</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <section className="premium-noise relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="enterprise-grid pointer-events-none absolute inset-0 opacity-45"
      />
      <div
        aria-hidden
        className="bg-dot-pattern pointer-events-none absolute inset-0 opacity-[0.07]"
      />
      <GlowBackground variant="centered" />

      <main className="relative mx-auto flex w-full max-w-md flex-col items-center gap-8">
        <BrandLogo />

        <Suspense
          fallback={
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                    <Loader2 className="text-primary h-6 w-6 animate-spin" />
                  </div>
                </div>
                <CardTitle className="text-lg">
                  Einladung wird verarbeitet...
                </CardTitle>
                <CardDescription>
                  Bitte warte einen Moment.
                </CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <AcceptInviteContent />
        </Suspense>
      </main>
    </section>
  );
}
