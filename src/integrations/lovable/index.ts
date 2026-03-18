import { createLovableAuth } from "@lovable.dev/cloud-auth-js";

const lovableAuth = createLovableAuth();

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const auth = {
  signInWithOAuth: async (
    provider: "google" | "apple",
    opts?: SignInOptions
  ) => {
    return await lovableAuth.signInWithOAuth(provider, {
      redirect_uri: opts?.redirect_uri,
      extraParams: opts?.extraParams,
    });
  },
};