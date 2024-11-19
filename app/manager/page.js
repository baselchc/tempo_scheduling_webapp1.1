"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import NavBar from "./components/NavBar";
import { Notifications, CheckCircleOutline } from "@mui/icons-material"; // Import CheckCircleOutline icon
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../backend/database/supabaseClient";
import { format, addDays, subDays, parseISO, isSameDay } from "date-fns";

export default function ManagerDashboard() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("/images/default-avatar.png");
  const [code, setCode] = useState("");
  const [storedCode, setStoredCode] = useState(localStorage.getItem("storedCode") || "1111");
  const [userSchedules, setUserSchedules] = useState([]);
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const handleCodeChange = () => {
    localStorage.setItem("storedCode", code);
    setStoredCode(code);
    setCode("");
  };

  // Fetch profile image
  useEffect(() => {
    const fetchUserProfileImage = async () => {
      try {
        const token = await getToken();
        const response = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        setProfileImageUrl(
          response.ok && data.profileImageUrl
            ? `${data.profileImageUrl}?t=${new Date().getTime()}`
            : "/images/default-avatar.png"
        );
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    if (user) fetchUserProfileImage();
  }, [user, getToken]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userRecord) {
        console.error("Error fetching user record:", userError.message);
        return;
      }

      const userId = userRecord.id;

      const { data, error } = await supabase
        .from("notifications")
        .select("id, message, is_read")
        .or(`to_user_id.eq.${userId},broadcast.eq.true`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error.message);
      } else {
        setNotifications(data || []);
      }
    };

    fetchNotifications();
  }, [user]);

  // Count unread notifications
  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  const fetchData = async (startOfWeek) => {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, first_name, last_name, clerk_user_id");

    if (usersError) {
      console.error("Error fetching users:", usersError.message);
      return;
    }

    const { data: shifts, error: shiftsError } = await supabase
      .from("my_shifts")
      .select("user_id, shift_start, shift_end");

    if (shiftsError) {
      console.error("Error fetching shifts:", shiftsError.message);
      return;
    }

    const weeklySchedules = users.map((user) => {
      const shiftsForUser = Array(7).fill("Off");

      shifts.forEach((shift) => {
        if (shift.user_id === user.clerk_user_id) {
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(currentDay.getDate() + dayIndex);

            const shiftStart = parseISO(shift.shift_start);
            const shiftEnd = parseISO(shift.shift_end);

            if (isSameDay(shiftStart, currentDay)) {
              const shiftTimeRange = `${format(shiftStart, "hh:mm a")} - ${format(shiftEnd, "hh:mm a")}`;
              shiftsForUser[dayIndex] = shiftTimeRange;
            }
          }
        }
      });

      return {
        userName: `${user.first_name} ${user.last_name}`,
        shifts: shiftsForUser,
        userId: user.id,
      };
    });

    setUserSchedules(weeklySchedules);
  };

  useEffect(() => {
    const startOfWeek = new Date(weekStartDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    fetchData(startOfWeek);
  }, [weekStartDate]);

  const monthName = format(weekStartDate, "MMMM");
  const weekDaysWithDates = Array.from({ length: 7 }).map((_, index) => {
    const day = addDays(weekStartDate, index - weekStartDate.getDay());
    return {
      dayOfWeek: format(day, "EEEE"),
      dayOfMonth: format(day, "d"),
    };
  });

  const handlePreviousWeek = () => {
    setWeekStartDate((prevDate) => subDays(prevDate, 7));
  };

  const handleNextWeek = () => {
    setWeekStartDate((prevDate) => addDays(prevDate, 7));
  };

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error.message);
    } else {
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    }
  };

  const handleNotificationClick = async (notificationId) => {
    await markAsRead(notificationId);
    router.push("/manager/messages");
  };

  return (
    <div className="relative min-h-screen text-black">
      <Image
        src="/images/loginpagebackground.webp"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 -z-10 bg-cover bg-center filter blur-2xl"
      />

      <NavBar menuOpen={menuOpen} toggleMenu={toggleMenu} />

      <div className="absolute top-4 right-8 flex items-center gap-4 z-50">
        <button onClick={toggleNotifications} className="relative">
          <Notifications className="text-white text-4xl cursor-pointer" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-4 flex items-center justify-center">
              {unreadNotificationCount}
            </span>
          )}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4 z-50">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="mb-2 flex items-center justify-between">
                    <p
                      onClick={() => handleNotificationClick(notification.id)}
                      className="cursor-pointer hover:text-blue-600"
                    >
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <CheckCircleOutline
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 cursor-pointer hover:text-black"
                        titleAccess="Mark as read"
                      />
                    )}
                  </div>
                ))
              ) : (
                <p>No new notifications.</p>
              )}
            </div>
          )}
        </button>

        <button onClick={toggleProfileMenu} className="flex items-center gap-2">
          <Image
            className="rounded-full"
            src={profileImageUrl}
            alt="Profile image"
            width={30}
            height={30}
          />
          <span className="text-white font-semibold">
            {user?.emailAddresses[0].emailAddress}
          </span>
        </button>
      </div>

      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? "ml-64" : "ml-20"}`}>
        <h1 className="text-4xl font-bold text-left text-white mb-8">
          Welcome to the Manager Dashboard
        </h1>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-4">
          <button onClick={handlePreviousWeek}>{"<"}</button>
          {`Weekly Employee Schedule - ${monthName}`}
          <button onClick={handleNextWeek}>{">"}</button>
        </h2>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <table className="w-full text-center">
            <thead>
              <tr>
                <th className="text-left p-4">Employee</th>
                {weekDaysWithDates.map(({ dayOfWeek, dayOfMonth }, index) => (
                  <th key={index} className="p-4">{`${dayOfWeek} ${dayOfMonth}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userSchedules.map((user) => (
                <tr key={user.userId}>
                  <td className="text-left p-4 border-b">{user.userName}</td>
                  {user.shifts.map((shift, shiftIndex) => (
                    <td key={shiftIndex} className="p-4 border-b">
                      {shift}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}