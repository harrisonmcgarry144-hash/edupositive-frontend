import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const SocketContext = createContext({ connected: false, notifications: [], emit: () => {}, clearNotifs: () => {} });

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifs] = useState([]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    let socket;
    try {
      const io = require("socket.io-client");
      socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
        auth: { token: localStorage.getItem("ep_token") },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 3,
      });

      socketRef.current = socket;
      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("connect_error", () => setConnected(false));

      socket.on("new_message", (data) => {
        setNotifs(p => [{ type: "message", ...data, id: Date.now() }, ...p.slice(0, 9)]);
        window.dispatchEvent(new CustomEvent("ep:new_message", { detail: data }));
      });
      socket.on("xp_update", (data) => {
        window.dispatchEvent(new CustomEvent("ep:xp_update", { detail: data }));
      });
      socket.on("friend_accepted", (data) => {
        setNotifs(p => [{ type: "friend", ...data, id: Date.now() }, ...p.slice(0, 9)]);
      });
    } catch(e) {
      // socket.io-client not available, skip silently
    }

    return () => { try { socket?.disconnect(); } catch(e) {} };
  }, [user?.id]);

  const emit = (event, data) => {
    try { if (socketRef.current?.connected) socketRef.current.emit(event, data); } catch(e) {}
  };

  return (
    <SocketContext.Provider value={{ connected, notifications, emit, clearNotifs: () => setNotifs([]) }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
