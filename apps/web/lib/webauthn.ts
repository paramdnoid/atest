function fromBase64Url(input: string): Uint8Array {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function transformPublicKeyOptions(options: any): PublicKeyCredentialRequestOptions {
  const transformed: PublicKeyCredentialRequestOptions = {
    ...options,
    challenge: fromBase64Url(options.challenge),
    allowCredentials: (options.allowCredentials ?? []).map((cred: any) => ({
      ...cred,
      id: fromBase64Url(cred.id)
    }))
  };

  return transformed;
}

function transformCreationOptions(options: any): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: fromBase64Url(options.challenge),
    user: {
      ...options.user,
      id: fromBase64Url(options.user.id)
    },
    excludeCredentials: (options.excludeCredentials ?? []).map((cred: any) => ({
      ...cred,
      id: fromBase64Url(cred.id)
    }))
  };
}

export async function createAssertion(plainOptions: string): Promise<string> {
  const parsed = JSON.parse(plainOptions);
  const options = transformPublicKeyOptions(parsed);

  const credential = (await navigator.credentials.get({
    publicKey: options
  })) as PublicKeyCredential;

  const response = credential.response as AuthenticatorAssertionResponse;

  return JSON.stringify({
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      authenticatorData: toBase64Url(response.authenticatorData),
      signature: toBase64Url(response.signature),
      userHandle: response.userHandle ? toBase64Url(response.userHandle) : ''
    }
  });
}

export async function createRegistration(plainOptions: string): Promise<string> {
  const parsed = JSON.parse(plainOptions);
  const options = transformCreationOptions(parsed);

  const credential = (await navigator.credentials.create({
    publicKey: options
  })) as PublicKeyCredential;

  const response = credential.response as AuthenticatorAttestationResponse;

  return JSON.stringify({
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      attestationObject: toBase64Url(response.attestationObject)
    }
  });
}
