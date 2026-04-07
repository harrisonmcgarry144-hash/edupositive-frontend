import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifs] = useState([]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    // Dynamically import socket.io-client
    import("socket.io-client").then(({ io }) => {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
        auth: { token: localStorage.getItem("ep_token") },
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));

      // XP/level update — refresh user data
      socket.on("xp_update", (data) => {
        window.dispatchEvent(new CustomEvent("ep:xp_update", { detail: data }));
      });

      // New message
      socket.on("new_message", (data) => {
        setNotifs(p => [{ type: "message", ...data, id: Date.now() }, ...p.slice(0, 9)]);
        window.dispatchEvent(new CustomEvent("ep:new_message", { detail: data }));
      });

      // Friend accepted
      socket.on("friend_accepted", (data) => {
        setNotifs(p => [{ type: "friend", ...data, id: Date.now() }, ...p.slice(0, 9)]);
      });

      // Flashcard session complete
      socket.on("flashcard_complete", (data) => {
        window.dispatchEvent(new CustomEvent("ep:flashcard_complete", { detail: data }));
      });

      // Lesson complete
      socket.on("lesson_complete", (data) => {
        window.dispatchEvent(new CustomEvent("ep:lesson_complete", { detail: data }));
      });

      // Leaderboard update
      socket.on("leaderboard_update", (data) => {
        window.dispatchEvent(new CustomEvent("ep:leaderboard_update", { detail: data }));
      });

      return () => socket.disconnect();
    }).catch(() => {});
  }, [user?.id]);

  const emit = (event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider value={{ connected, notifications, emit, clearNotifs: () => setNotifs([]) }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
