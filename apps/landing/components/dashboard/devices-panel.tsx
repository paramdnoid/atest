"use client";

import { fetchApi } from "@/lib/api-client";
import { Check, Copy, Monitor, RefreshCw, ShieldCheck, ShieldOff, Smartphone, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Device = {
  id: string;
  name: string;
  platform: string;
  status: string;
  licensedAt: string | null;
  revokedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
};

type Props = {
  devices: Device[];
  error?: boolean;
  licensedCount: number;
  licenseLimit: number | null;
  registrationToken: string | null;
  isAdmin: boolean;
};

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "ios" || platform === "android") {
    return <Smartphone className="h-4 w-4 text-muted-foreground" />;
  }
  return <Monitor className="h-4 w-4 text-muted-foreground" />;
}

function DeviceStatusBadge({ device }: { device: Device }) {
  if (device.status === "licensed") {
    return (
      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
        Lizenziert
      </Badge>
    );
  }
  if (device.status === "revoked") {
    return (
      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
        Gesperrt
      </Badge>
    );
  }
  return <Badge variant="secondary">Ausstehend</Badge>;
}

export function DevicesPanel({
  devices: initialDevices,
  error,
  licensedCount,
  licenseLimit,
  registrationToken: initialToken,
  isAdmin,
}: Props) {
  const [devices, setDevices] = useState(initialDevices);
  const [registrationToken, setRegistrationToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [renewingToken, setRenewingToken] = useState(false);
  const [loadingDeviceId, setLoadingDeviceId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Device | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<Device | null>(null);
  const localLicensedCount = devices.filter((d) => d.status === "licensed").length;

  async function handleCopyToken() {
    if (!registrationToken) return;
    await navigator.clipboard.writeText(registrationToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRenewToken() {
    setRenewingToken(true);
    try {
      const res = await fetchApi("/v1/devices/registration-token/renew", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRegistrationToken(data.token);
      toast.success("Token erneuert. Alte Codes sind ungültig.");
    } catch {
      toast.error("Token konnte nicht erneuert werden.");
    } finally {
      setRenewingToken(false);
    }
  }

  async function handleAssignLicense(device: Device) {
    setLoadingDeviceId(device.id);
    try {
      const res = await fetchApi(`/v1/devices/${device.id}/license`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error ?? "Lizenz konnte nicht vergeben werden.");
        return;
      }
      const updated = await res.json();
      setDevices((prev) => prev.map((d) => d.id === device.id ? { ...d, ...updated } : d));
      toast.success(`Lizenz für „${device.name}" vergeben.`);
    } catch {
      toast.error("Netzwerkfehler.");
    } finally {
      setLoadingDeviceId(null);
    }
  }

  async function handleRevokeLicense(device: Device) {
    setLoadingDeviceId(device.id);
    setConfirmRevoke(null);
    try {
      const res = await fetchApi(`/v1/devices/${device.id}/license`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDevices((prev) => prev.map((d) => d.id === device.id ? { ...d, status: "revoked" } : d));
      toast.success(`Lizenz für „${device.name}" entzogen.`);
    } catch {
      toast.error("Lizenz konnte nicht entzogen werden.");
    } finally {
      setLoadingDeviceId(null);
    }
  }

  async function handleRemoveDevice(device: Device) {
    setLoadingDeviceId(device.id);
    setConfirmRemove(null);
    try {
      const res = await fetchApi(`/v1/devices/${device.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDevices((prev) => prev.filter((d) => d.id !== device.id));
      toast.success(`Gerät „${device.name}" entfernt.`);
    } catch {
      toast.error("Gerät konnte nicht entfernt werden.");
    } finally {
      setLoadingDeviceId(null);
    }
  }

  const maskedToken = registrationToken
    ? `${registrationToken.slice(0, 8)}${"•".repeat(20)}${registrationToken.slice(-4)}`
    : null;

  const effectiveLicensedCount = Math.max(licensedCount, localLicensedCount);
  const effectiveAtLimit = licenseLimit != null && effectiveLicensedCount >= licenseLimit;

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Registrierungscode</CardTitle>
                <CardDescription>
                  Geräte verwenden diesen Code, um sich im Workspace anzumelden.
                </CardDescription>
              </div>
              <Badge
                variant={effectiveAtLimit ? "destructive" : "outline"}
                className="text-sm tabular-nums"
              >
                {effectiveLicensedCount}
                {licenseLimit != null ? ` / ${licenseLimit}` : ""} Lizenzen vergeben
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {registrationToken ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm select-none">
                  {maskedToken}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyToken} title="Kopieren" aria-label="Registrierungscode kopieren">
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRenewToken}
                    disabled={renewingToken}
                    title="Token erneuern"
                    aria-label="Registrierungscode erneuern"
                  >
                    <RefreshCw className={`h-4 w-4 ${renewingToken ? "animate-spin" : ""}`} />
                  </Button>
                )}
              </div>
            ) : isAdmin ? (
              <Button variant="outline" onClick={handleRenewToken} disabled={renewingToken}>
                <RefreshCw className={`mr-2 h-4 w-4 ${renewingToken ? "animate-spin" : ""}`} />
                Token generieren
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nur Admins oder Inhaber können den Registrierungscode anzeigen und erneuern.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geräte</CardTitle>
            <CardDescription>
              {error
                ? "Geräte konnten nicht geladen werden."
                : devices.length === 0
                ? "Noch keine Geräte registriert."
                : `${devices.length} Gerät${devices.length !== 1 ? "e" : ""} registriert`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <div className="px-6 py-6 text-sm text-muted-foreground">
                Gerätedaten konnten nicht geladen werden. Bitte Seite neu laden.
              </div>
            ) : devices.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Plattform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registriert</TableHead>
                    {isAdmin && <TableHead className="w-35">Aktionen</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="pl-6 font-medium">{device.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={device.platform} />
                          <span className="text-sm capitalize text-muted-foreground">
                            {device.platform}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DeviceStatusBadge device={device} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {new Date(device.createdAt).toLocaleDateString("de-DE")}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {device.status === "licensed" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={loadingDeviceId === device.id}
                                onClick={() => setConfirmRevoke(device)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                <ShieldOff className="mr-1 h-3 w-3" />
                                Entziehen
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={loadingDeviceId === device.id || effectiveAtLimit}
                                onClick={() => handleAssignLicense(device)}
                                className="text-xs"
                                title={effectiveAtLimit ? "Lizenzlimit erreicht" : undefined}
                              >
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                Lizenz vergeben
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={loadingDeviceId === device.id}
                              onClick={() => setConfirmRemove(device)}
                              className="text-destructive hover:text-destructive"
                              title="Gerät entfernen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirmRevoke} onOpenChange={(open) => !open && setConfirmRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lizenz entziehen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Lizenz für <strong>{confirmRevoke?.name}</strong> wird entzogen. Das Gerät kann
              die App nicht mehr nutzen, bleibt aber registriert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRevoke && handleRevokeLicense(confirmRevoke)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Lizenz entziehen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerät entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmRemove?.name}</strong> wird dauerhaft aus dem Workspace entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && handleRemoveDevice(confirmRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
