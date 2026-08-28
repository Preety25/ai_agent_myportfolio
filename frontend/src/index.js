import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

// NOTE: We intentionally omit React.StrictMode here. The @elevenlabs/react
// SDK opens a WebRTC/WebSocket transport inside useEffect, and StrictMode's
// synthetic mount → cleanup → mount cycle in development immediately
// closes the freshly-opened socket ("WebSocket is already in CLOSING or
// CLOSED state"), which cascades into the SDK returning `disconnected`
// straight after `connected`. Production builds do not run StrictMode's
// double-invocation, so shipping without it here matches production
// behaviour and lets the conversation stay open in local dev.
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
