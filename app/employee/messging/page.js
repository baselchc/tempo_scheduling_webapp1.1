"use client";

import { useUser} from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { supabase } from "/backend/database/supabaseClient";
import { useRouter } from "next/navigation";

export default function MessagingPage() {
  const { user } = useUser();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [users, setUsers] = useState([]);


  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("email");
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err.message);
    }
  };

  const fetchMessages = async () => {
    try {
      const senderEmail = user?.emailAddresses?.[0]?.email;
      if (!senderEmail || !recipient) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_email.eq.${senderEmail},receiver_email.eq.${recipient}),and(sender_email.eq.${recipient},receiver_email.eq.${senderEmail})`
        )
        .order("timestamp", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err.message);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipient) return;

    try {
      const senderEmail = user?.emailAddresses?.[0]?.email;

      const { data, error } = await supabase.from("messages").insert([
        {
          sender_email: senderEmail,
          receiver_email: recipient,
          content: newMessage,
        },
      ]);

      if (error) throw error;
      setMessages((prev) => [...prev, ...data]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  };


  return (
    <div>
      <h1>Messages</h1>

      <div>
        <label>Recipient:</label>
        <select value={recipient} onChange={(e) => setRecipient(e.target.value)}>
          <option value="">Select a user</option>
          {users.map((user) => (
            <option key={user.email} value={user.email}>
              {user.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <input
          type="text"
          placeholder="Type your message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
          
    </div>
  );
}
