// Every API data type, written by hand to mirror ../docs/api.md (D11).
// Change a shape here in the same ticket as docs/api.md and the Go handler.

/** The single error shape of every endpoint (D15). */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    /** Present only on validation errors: the request field that failed. */
    field?: string;
  };
};

export type Health = {
  status: "ok";
};

// Session

export type Owner = {
  id: number;
  email: string;
};

export type SignInRequest = {
  email: string;
  password: string;
  /** Stay signed in on this device for 30 days (A2). */
  remember: boolean;
};

export type SessionResponse = {
  owner: Owner;
};
