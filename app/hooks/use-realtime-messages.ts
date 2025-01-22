import { useEffect, useState } from "react";
import type { Message } from "~/types/chat";
import { useOutletContext } from "@remix-run/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";

type ContextType = { 
  supabase: SupabaseClient<Database>;
  session: any;
};

export function useRealtimeMessages(roomId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { supabase } = useOutletContext<ContextType>();

  useEffect(() => {
    if (!roomId || !supabase) return;

    console.log('Setting up real-time subscription for room:', roomId);

    supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload: { new: Message }) => {
          console.log('Received new message:', payload.new);
          setMessages((current) => {
            // Avoid duplicate messages
            const exists = current.some(msg => msg.id === payload.new.id);
            if (exists) return current;
            return [...current, payload.new];
          });
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for room ${roomId}:`, status);
      });

    return () => {
      console.log(`Unsubscribing from room ${roomId}`);
      supabase.channel(`messages:${roomId}`).unsubscribe();
    };
  }, [roomId, supabase]);

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  return messages;
} 