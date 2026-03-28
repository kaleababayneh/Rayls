"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { useState, type ReactNode } from "react";

export const raylsPublicChain = defineChain({
  id: 7295799,
  name: "Rayls Public Testnet",
  nativeCurrency: { name: "USDR", symbol: "USDR", decimals: 18 },
  rpcUrls: {
    default: { http: ["/api/rpc/public"] },
  },
  blockExplorers: {
    default: { name: "Rayls Explorer", url: "https://testnet-explorer.rayls.com" },
  },
});

const wagmiConfig = createConfig({
  chains: [raylsPublicChain],
  transports: {
    [raylsPublicChain.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
