import type { CDPSession, Page } from '@playwright/test';

export type VirtualAuthenticator = {
  authenticatorId: string;
  cdp: CDPSession;
};

export async function attachVirtualAuthenticator(page: Page): Promise<VirtualAuthenticator> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');

  const response = await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true
    }
  });

  return {
    authenticatorId: response.authenticatorId as string,
    cdp
  };
}

export async function detachVirtualAuthenticator(authenticator: VirtualAuthenticator): Promise<void> {
  try {
    await authenticator.cdp.send('WebAuthn.removeVirtualAuthenticator', {
      authenticatorId: authenticator.authenticatorId
    });
  } finally {
    await authenticator.cdp.send('WebAuthn.disable').catch(() => {});
    await authenticator.cdp.detach().catch(() => {});
  }
}
