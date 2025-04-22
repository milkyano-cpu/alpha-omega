// Types for the Square Web Payments SDK

declare namespace Square {
  interface Payments {
    card(options?: CardOptions): Promise<Card>;
  }

  interface TokenResult {
    status: 'OK' | 'ERROR';
    token?: string;
    errors?: Array<{
      code: string;
      detail: string;
      field?: string;
    }>;
  }

  interface VerificationDetails {
    amount: string;
    currencyCode: string;
    intent: 'CHARGE' | 'STORE' | string; // Allow string type for flexibility
    billingContact?: {
      givenName?: string;
      familyName?: string;
      email?: string;
      phone?: string;
      addressLines?: string[];
      city?: string;
      state?: string;
      postalCode?: string;
      countryCode: string;
    };
    customerInitiated?: boolean;
    sellerKeyedIn?: boolean;
  }

  interface Card {
    attach(selector: string): Promise<void>;
    detach(): Promise<boolean>;
    destroy(): Promise<boolean>;
    tokenize(verificationDetails?: VerificationDetails): Promise<TokenResult>;
    configure(options: CardOptions): Promise<void>;
    focus(field: 'cardNumber' | 'cvv' | 'expirationDate' | 'postalCode'): Promise<boolean>;
    clear(): Promise<boolean>;
    addEventListener(
      eventType: string,
      callback: (event: any) => void
    ): void;
    removeEventListener(
      eventType: string,
      callback: (event: any) => void
    ): void;
  }

  interface CardOptions {
    postalCode?: string;
    style?: {
      [key: string]: any;
    };
  }
}

interface Window {
  Square: {
    payments(applicationId: string, locationId: string): {
      card(options?: Square.CardOptions): Promise<Square.Card>;
    };
  };
}
