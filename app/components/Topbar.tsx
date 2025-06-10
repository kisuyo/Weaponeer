import { TonConnectWallet } from "./ConnectWallet";

export default function Topbar() {
  return (
    <div className="flex  h-[60px] w-full">
      <div className="flex items-center justify-between w-full">
        <TonConnectWallet />
      </div>
    </div>
  );
}
