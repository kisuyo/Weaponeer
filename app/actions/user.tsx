// user.ts

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTonWallet } from "@tonconnect/ui-react";
import { $getUserByAddress } from "./actions";
import { players } from "@/db/schema";

type Player = typeof players.$inferSelect;

interface UserContextType {
  userData: Player | null;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const wallet = useTonWallet();

  useEffect(() => {
    async function fetchUserData() {
      if (!wallet?.account?.address) {
        setUserData(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [result, error] = await $getUserByAddress({
          address: wallet.account.address,
        });

        if (error || !result) {
          setError(new Error(error?.message || "Failed to fetch user data"));
          setUserData(null);
        } else {
          setUserData(result.data);
          setError(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch user data")
        );
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [wallet?.account?.address]);

  return (
    <UserContext.Provider value={{ userData, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
