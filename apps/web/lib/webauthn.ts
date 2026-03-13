function fromBase64Url(input: string): ArrayBuffer {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

type RecordValue = Record<string, unknown>;
export class WebAuthnUserCancelledError extends Error {
  constructor(message = 'WebAuthn Vorgang wurde abgebrochen.') {
    super(message);
    this.name = 'WebAuthnUserCancelledError';
  }
}

type EncodedDescriptor = {
  id: string;
  type?: PublicKeyCredentialType;
  transports?: AuthenticatorTransport[];
};

type EncodedRequestOptions = {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: EncodedDescriptor[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
};

type EncodedUserEntity = {
  id: string;
  name: string;
  displayName: string;
};

type EncodedCreationOptions = {
  challenge: string;
  rp: PublicKeyCredentialRpEntity;
  user: EncodedUserEntity;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  excludeCredentials?: EncodedDescriptor[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  extensions?: AuthenticationExtensionsClientInputs;
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function unwrapPublicKey(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return 'publicKey' in value ? value.publicKey : value;
}

function mapDescriptors(raw: unknown): PublicKeyCredentialDescriptor[] {
  if (!Array.isArray(raw)) return [];

  const descriptors: PublicKeyCredentialDescriptor[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const id = getString(entry.id);
    if (!id) continue;
    descriptors.push({
      id: fromBase64Url(id),
      type: (entry.type as PublicKeyCredentialType | undefined) ?? 'public-key',
      transports: Array.isArray(entry.transports)
        ? (entry.transports as AuthenticatorTransport[])
        : undefined,
    });
  }
  return descriptors;
}

function transformPublicKeyOptions(rawOptions: unknown): PublicKeyCredentialRequestOptions {
  const unwrapped = unwrapPublicKey(rawOptions);
  if (!isRecord(unwrapped)) {
    throw new Error('Invalid WebAuthn request options');
  }

  const options = unwrapped as EncodedRequestOptions;
  if (!options.challenge || typeof options.challenge !== 'string') {
    throw new Error('Missing WebAuthn challenge');
  }

  return {
    challenge: fromBase64Url(options.challenge),
    timeout: options.timeout,
    rpId: options.rpId,
    allowCredentials: mapDescriptors(options.allowCredentials),
    userVerification: options.userVerification,
    extensions: options.extensions,
  };
}

function transformCreationOptions(rawOptions: unknown): PublicKeyCredentialCreationOptions {
  const unwrapped = unwrapPublicKey(rawOptions);
  if (!isRecord(unwrapped)) {
    throw new Error('Invalid WebAuthn creation options');
  }

  const options = unwrapped as EncodedCreationOptions;
  if (!options.challenge || typeof options.challenge !== 'string') {
    throw new Error('Missing WebAuthn challenge');
  }
  if (!options.user || typeof options.user.id !== 'string') {
    throw new Error('Missing WebAuthn user');
  }

  return {
    challenge: fromBase64Url(options.challenge),
    rp: options.rp,
    user: {
      ...options.user,
      id: fromBase64Url(options.user.id)
    },
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    attestation: options.attestation,
    authenticatorSelection: options.authenticatorSelection,
    extensions: options.extensions,
    excludeCredentials: mapDescriptors(options.excludeCredentials),
  };
}

export async function createAssertion(plainOptions: string): Promise<string> {
  const parsed = JSON.parse(plainOptions);
  const options = transformPublicKeyOptions(parsed);

  let rawCredential: Credential | null;
  try {
    rawCredential = await navigator.credentials.get({
      publicKey: options
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new WebAuthnUserCancelledError();
    }
    throw error;
  }
  if (!rawCredential) {
    throw new WebAuthnUserCancelledError();
  }
  const credential = rawCredential as PublicKeyCredential;

  const response = credential.response as AuthenticatorAssertionResponse;
  const responseJson: Record<string, string | null> = {
    clientDataJSON: toBase64Url(response.clientDataJSON),
    authenticatorData: toBase64Url(response.authenticatorData),
    signature: toBase64Url(response.signature)
  };

  if (response.userHandle) {
    responseJson.userHandle = toBase64Url(response.userHandle);
  }

  return JSON.stringify({
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? null,
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
    response: responseJson
  });
}

export async function createRegistration(plainOptions: string): Promise<string> {
  const parsed = JSON.parse(plainOptions);
  const options = transformCreationOptions(parsed);

  let rawCredential: Credential | null;
  try {
    rawCredential = await navigator.credentials.create({
      publicKey: options
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new WebAuthnUserCancelledError();
    }
    throw error;
  }
  if (!rawCredential) {
    throw new WebAuthnUserCancelledError();
  }
  const credential = rawCredential as PublicKeyCredential;

  const response = credential.response as AuthenticatorAttestationResponse;
  const transports = typeof response.getTransports === 'function' ? response.getTransports() : [];

  return JSON.stringify({
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? null,
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      attestationObject: toBase64Url(response.attestationObject),
      transports
    }
  });
}
