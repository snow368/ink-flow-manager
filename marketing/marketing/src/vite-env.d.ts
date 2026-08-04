/// <reference types="vite/client" />

/* Google Identity Services (GIS) — loaded from CDN at runtime */
declare namespace google.accounts.id {
  interface CredentialResponse {
    credential: string;
    select_by?: string;
  }
  interface IdConfiguration {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: 'signin' | 'signup' | 'use';
  }
  interface GsiButtonConfiguration {
    type: 'standard' | 'icon';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    size?: 'large' | 'medium' | 'small';
    width?: number;
    logo_alignment?: 'left' | 'center';
  }
  function initialize(config: IdConfiguration): void;
  function renderButton(parent: HTMLElement, options: GsiButtonConfiguration): void;
  function disableAutoSelect(): void;
}

interface Window {
  google?: {
    accounts: {
      id: typeof google.accounts.id;
    };
  };
}
