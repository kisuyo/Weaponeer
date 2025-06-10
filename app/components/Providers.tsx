"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { UserProvider } from "../actions/user";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TonConnectUIProvider manifestUrl="https://gpton.co/connect-manifest.json">
        <UserProvider>{children}</UserProvider>
      </TonConnectUIProvider>
    </>
  );
}
