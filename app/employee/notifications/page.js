// app/manager/messages/page.js

"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import NavBar from "../components/NavBar";
import { Notifications } from "@mui/icons-material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from '../../../lib/supabase-browser'
import { AnimatePresence, motion } from "framer-motion";

export default function MessagesPage() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("/images/default-avatar.png");
  const [notifications, setNotifications] = useState([]);
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [messageBody, setMessageBody] = useState("");
  const [recipient, setRecipient] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [conversationReplies, setConversationReplies] = useState({});
  const [users, setUsers] = useState([]);
  const replyBoxRef = useRef(null);
  const router = useRouter();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  useEffect(() => {
    const fetchUserProfileImage = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        setProfileImageUrl(
          response.ok && data.profileImageUrl ? `${data.profileImageUrl}?t=${new Date().getTime()}` : "/images/default-avatar.png"
        );
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    if (user) {
      fetchUserProfileImage();
      fetchNotifications();
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, getToken]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id, clerk_user_id") // Select both 'id' and 'clerk_user_id'
      .eq("clerk_user_id", user.id)
      .single();

    if (userError || !userRecord) {
      console.error("Error fetching user record:", userError?.message);
      return;
    }

    const userId = userRecord.id;

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        sender:from_user_id (first_name, last_name, clerk_user_id)
      `)
      .or(`to_user_id.eq.${userId},broadcast.eq.true`) // Query both personal and broadcast notifications
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error.message);
    } else {
      setNotifications(data || []);
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
    if (!messageBody || (!recipient && recipient !== "broadcast")) return;

    const { data: userRecord } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", user.id)
      .single();

    const userId = userRecord.id;
    const conversationId = recipient === "broadcast" ? null : crypto.randomUUID(); // New conversation ID for individual messages

    const { error } = await supabase.from("notifications").insert({
      from_user_id: userId,
      to_user_id: recipient === "broadcast" ? null : recipient,
      message: messageBody,
      broadcast: recipient === "broadcast",
      conversation_id: conversationId,
    });

    if (error) {
      console.error("Error sending message:", error.message);
    } else {
      setMessageBody("");
      setRecipient("");
      fetchNotifications();
    }
  };

  const handleSendReply = async (parentNotificationId) => {
    if (!replyBody) return;

    const { data: userRecord } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", user.id)
      .single();

    const userId = userRecord.id;

    const originalNotification = notifications.find((n) => n.id === parentNotificationId);
    const conversationId = originalNotification?.conversation_id || originalNotification?.id;

    const { error } = await supabase.from("notifications").insert({
      from_user_id: userId,
      to_user_id: originalNotification.from_user_id, // Replying back to sender
      message: replyBody,
      conversation_id: conversationId,
    });

    if (error) {
      console.error("Error sending reply:", error.message);
    } else {
      setReplyBody("");
      fetchConversationReplies(conversationId);
    }
  };
  

  const fetchConversationReplies = async (conversationId) => {
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        sender:from_user_id (first_name, last_name, clerk_user_id)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching conversation replies:", error.message);
    } else {
      setConversationReplies((prevReplies) => ({
        ...prevReplies,
        [conversationId]: data,
      }));
    }
  };

  const toggleMessageExpansion = (id) => {
    setExpandedMessageId(expandedMessageId === id ? null : id);
    if (expandedMessageId !== id) {
      const notification = notifications.find((n) => n.id === id);
      const conversationId = notification?.conversation_id || notification?.id;
      fetchConversationReplies(conversationId);
    }
  };

  return (
    <div className="relative min-h-screen text-black">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
        style={{ backgroundImage: `url('/images/loginpagebackground.webp')` }}
      ></div>

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
          <Image
            className="rounded-full"
            src={profileImageUrl}
            alt="Profile image"
            width={40}
            height={40}
            onError={() => setProfileImageUrl("/images/default-avatar.png")}
          />
          <span className="text-white font-semibold">{user?.emailAddresses[0].emailAddress}</span>
        </button>
        {profileMenuOpen && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg p-4 w-48 z-50">
            <ul>
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push("/employee/profile")}
              >
                Edit Profile
              </li>
              <li
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => signOut()}
              >
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? "ml-64" : "ml-20"}`}>
        <h1 className="text-4xl font-bold text-center text-white mb-8">Notifications</h1>

        <div className="bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Create notification</h2>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full mb-2 p-2 border rounded-lg"
          >
            <option value="">Select Recipient</option>
            <option value="broadcast">Broadcast to All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="What's in your mind?..."
            className="w-full p-2 border rounded-lg mb-2"
          ></textarea>
          <button
            onClick={handleSendMessage}
            className="w-full p-2 bg-blue-500 text-white rounded-lg"
          >
            Send Notification
          </button>
        </div>

        <div className="bg-black/20 backdrop-blur-lg p-6 shadow-lg rounded-lg border-2 border-white">
          <h2 className="text-2xl font-semibold mb-4 text-white">Notifications</h2>
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-4 border rounded-lg bg-white/90 cursor-pointer"
                onClick={() => toggleMessageExpansion(notification.id)}
              >
                <p className="font-semibold">{notification.message}</p>
                <p className="text-xs text-gray-500">
                  From: {notification.sender ? `${notification.sender.first_name} ${notification.sender.last_name}` : "Unknown"}
                </p>
                <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
                {expandedMessageId === notification.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {conversationReplies[notification.conversation_id]?.map((reply) => (
                      <div key={reply.id} className="mb-2">
                        <p className="font-semibold">
                          {reply.sender?.clerk_user_id === user.id ? "You" : `${reply.sender?.first_name || "Unknown"} ${reply.sender?.last_name || ""}`}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleString()}</p>
                        <p>{reply.message}</p>
                      </div>
                    ))}
                    <textarea
                      ref={replyBoxRef}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Type a reply..."
                      className="w-full p-2 border rounded-lg mb-2"
                    ></textarea>
                    <button
                      onClick={() => handleSendReply(notification.id)}
                      className="w-full p-2 bg-green-500 text-white rounded-lg"
                    >
                      Send Reply
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}

