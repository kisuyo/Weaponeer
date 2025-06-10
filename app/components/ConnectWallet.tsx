import { Address } from "@ton/core";
import {
  useTonConnectModal,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { motion } from "framer-motion";
import { LogOutIcon } from "lucide-react";

export function TonConnectWallet() {
  const wallet = useTonWallet();
  const { open } = useTonConnectModal();
  const [tonConnectUI] = useTonConnectUI();

  const shortenAddress = (address: string) => {
    if (!address) return "";
    const userFriendlyAddress = Address.parse(address).toString({
      bounceable: false,
    });
    const start = userFriendlyAddress.slice(0, 4);
    const end = userFriendlyAddress.slice(-4);
    return `${start}...${end}`;
  };

  if (!wallet?.account?.address) {
    return (
      <motion.div
        className="relative h-fit cursor-pointer"
        whileTap={{
          scale: 0.98,
          y: 6,
        }}
        transition={{
          duration: 0.1,
          ease: "easeInOut",
        }}
      >
        <div
          className="flex items-center justify-center font-medium bg-white text-black rounded-full p-1 px-4"
          onClick={open}
        >
          Connect Wallet
        </div>
      </motion.div>
    );
  }

  // Only show disconnect UI when we have a wallet
  return (
    <motion.div
      className="bg-neutral-700 p-1 flex items-center justify-center text-white/80 px-4 rounded-full"
      whileTap={{
        scale: 0.98,
        y: 6,
      }}
      transition={{
        duration: 0.1,
        ease: "easeInOut",
      }}
    >
      <div
        className="flex items-center justify-between gap-2 font-medium w-full"
        onClick={() => {
          tonConnectUI.disconnect();
        }}
      >
        <span>{shortenAddress(wallet.account.address)}</span>
        <button>
          <LogOutIcon size={16} />
        </button>
      </div>
    </motion.div>
  );
}
