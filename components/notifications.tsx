"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { playSound } from "@/lib/preferences";

type Notice = { kind: "success" | "error"; title: string; message: string };

const NotificationContext = createContext<(notice: Notice) => void>(() => {});

export const useNotification = () => useContext(NotificationContext);

export function Notifications({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<(Notice & { id: number }) | null>(null);
  const sequence = useRef(0);
  useEffect(() => {
    if (!notice || notice.kind === "error") return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <NotificationContext.Provider
      value={(value) => {
        playSound(value.kind);
        setNotice({ ...value, id: ++sequence.current });
      }}
    >
      {children}
      <div className="notification-region" aria-label="Powiadomienia">
        {notice && (
          <div
            key={notice.id}
            className={`notification notification-${notice.kind}`}
            role={notice.kind === "error" ? "alert" : "status"}
            aria-atomic="true"
          >
            {notice.kind === "success" ? <CheckCircle2 size={25} /> : <CircleAlert size={25} />}
            <div>
              <strong>{notice.title}</strong>
              <p>{notice.message}</p>
            </div>
            <button
              type="button"
              aria-label="Zamknij powiadomienie"
              onClick={() => setNotice(null)}
            >
              <X size={19} />
            </button>
          </div>
        )}
      </div>
    </NotificationContext.Provider>
  );
}
