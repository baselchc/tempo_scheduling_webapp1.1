"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { supabase } from "../../../backend/database/supabaseClient";
import Image from 'next/image';
import NavBar from '../components/NavBar';

export default function MessagingPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    if (user) {
      fetchCurrentUserId();
    }
  }, [user]);

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages();
    }
  }, [selectedUserId]);

  const fetchCurrentUserId = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user ID:", error.message);
    } else {
      setCurrentUserId(data.id);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id, 
        message, 
        created_at,
        from_user_id,
        to_user_id,
        from_user:from_user_id (first_name, last_name),
        to_user:to_user_id (first_name, last_name)
      `)
      .or(
        `and(from_user_id.eq.${currentUserId},to_user_id.eq.${selectedUserId}),and(from_user_id.eq.${selectedUserId},to_user_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error.message);
    } else {
      setMessages(data || []);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name");

    if (error) {
      console.error("Error fetching users:", error.message);
    } else {
      setUsers(data || []);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage || !selectedUserId || !currentUserId) return;

    const { error } = await supabase.from("messages").insert({
      message: newMessage,
      to_user_id: selectedUserId,
      from_user_id: currentUserId,
    });

    if (error) {
      console.error("Error sending message:", error.message);
    } else {
      setNewMessage("");
      fetchMessages();
    }
  };

  return (
    <div className="relative min-h-screen">
      <Image
          src="/images/loginpagebackground.webp"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 -z-10 filter blur-2xl"
      />

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className={`flex flex-row min-h-screen transition-all z-10 ${menuOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Sidebar */}
        <div className="w-1/4  border-r p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-white">Chats</h2>
          <ul className="space-y-2">
            {users.map((u) => (
              <li
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`text-white p-2 rounded cursor-pointer ${
                  selectedUserId === u.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-blue-100"
                }`}
              >
                {u.first_name} {u.last_name}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col ">
          {selectedUserId ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4 ">
                <h2 className="text-white text-xl font-semibold">
                  {users.find((u) => u.id === selectedUserId)?.first_name}{" "}
                  {users.find((u) => u.id === selectedUserId)?.last_name}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-scroll p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-black mb-4 p-3 rounded-lg ${
                      msg.from_user_id === currentUserId
                        ? "bg-white self-end"
                        : "bg-gray-200 self-start"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <span className="text-xs text-black">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t  text-black">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="border p-2 rounded w-full mb-2"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
