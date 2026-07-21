"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type FeedbackType = "dica" | "erro" | "sugestao";
export type FeedbackStatus = "novo" | "em_analise" | "resolvido";

export interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
}

interface FeedbackRow {
  id: string;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  created_at: string;
}

function rowToFeedback(row: FeedbackRow): FeedbackEntry {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    status: row.status,
    createdAt: row.created_at.slice(0, 10),
  };
}

interface FeedbackContextValue {
  feedback: FeedbackEntry[];
  addFeedback: (type: FeedbackType, message: string) => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    let active = true;

    async function loadFeedback() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("feedback")
        .select("id, type, message, status, created_at")
        .order("created_at", { ascending: false });

      if (!active) return;
      if (!error && data) {
        setFeedback((data as FeedbackRow[]).map(rowToFeedback));
      }
    }

    loadFeedback();
    return () => {
      active = false;
    };
  }, []);

  async function addFeedback(type: FeedbackType, message: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("feedback")
      .insert({ account_id: user.id, type, message })
      .select("id, type, message, status, created_at")
      .single();

    if (!error && data) {
      setFeedback((prev) => [rowToFeedback(data as FeedbackRow), ...prev]);
    }
  }

  return (
    <FeedbackContext.Provider value={{ feedback, addFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback deve ser usado dentro de FeedbackProvider");
  }
  return ctx;
}
