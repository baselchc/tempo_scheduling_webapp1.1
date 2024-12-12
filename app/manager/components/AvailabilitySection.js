// ManagerDashboard
"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { Notifications, CheckCircleOutline } from "@mui/icons-material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../../backend/database/supabaseClient";
import { format, addDays, subDays } from "date-fns";

export default function ManagerDashboard() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("/images/default-avatar.png");
  const [notifications, setNotifications] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySchedules, setDailySchedules] = useState([]);
  const router = useRouter();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);

  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleEditProfile = () => {
    router.push("/manager/profile");
  };

  const fetchNotifications = async () => {
    if (!user) return;

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", user.id)
      .single();

    if (userError || !userRecord) {
      console.error("Error fetching user record:", userError?.message);
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
    router.push("/manager/notifications");
  };

  const unreadNotificationCount = notifications.filter((n) => !n.is_read).length;

  const fetchProfileImage = async () => {
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

  const fetchSchedules = async (date) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("schedules")
        .select(`
          id,
          date,
          shift_type,
          status,
          employee:employee_id (first_name, last_name)
        `)
        .eq("date", formattedDate)
        .eq("status", "scheduled")
        .in("shift_type", ["morning", "evening"])
        .order("employee_id", { ascending: true });

      if (error) {
        console.error("Error fetching schedules:", error.message);
        setDailySchedules([]);
        return;
      }

      const employeeShifts = {};
      data.forEach((schedule) => {
        const employeeName = `${schedule.employee?.first_name || "Unknown"} ${schedule.employee?.last_name || ""}`;
        if (!employeeShifts[employeeName]) {
          employeeShifts[employeeName] = {
            id: schedule.id,
            employeeName,
            shiftTypes: new Set(),
            timing: [],
          };
        }

        employeeShifts[employeeName].shiftTypes.add(schedule.shift_type);

        if (schedule.shift_type === "morning") {
          employeeShifts[employeeName].timing.push("9:00 AM - 1:00 PM");
        } else if (schedule.shift_type === "evening") {
          employeeShifts[employeeName].timing.push("1:00 PM - 5:00 PM");
        }
      });

      const formattedSchedules = Object.values(employeeShifts).map((entry) => ({
        id: entry.id,
        employeeName: entry.employeeName,
        shiftType: Array.from(entry.shiftTypes).join("+"),
        shiftTiming:
          entry.timing.length === 2 ? "9:00 AM - 5:00 PM" : entry.timing[0],
      }));

      setDailySchedules(formattedSchedules);
    } catch (err) {
      console.error("Unexpected error:", err);
      setDailySchedules([]);
    }
  };

  useEffect(() => {
    fetchProfileImage();
    fetchNotifications();
    fetchSchedules(selectedDate);
  }, [user, selectedDate]);

  const handlePreviousDay = () => setSelectedDate((prevDate) => subDays(prevDate, 1));
  const handleNextDay = () => setSelectedDate((prevDate) => addDays(prevDate, 1));

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

        <div className="relative">
          <button onClick={toggleProfileMenu} className="flex items-center gap-2">
            <Image
              className="rounded-full"
              src={profileImageUrl}
              alt="Profile image"
              width={50}
              height={50}
            />
            <span className="text-white font-semibold">
              {user?.emailAddresses[0].emailAddress}
            </span>
          </button>
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-50">
              <button
                onClick={handleEditProfile}
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
              >
                Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`flex-grow p-8 transition-all z-10 ${menuOpen ? "ml-64" : "ml-20"}`}>
        <h1 className="text-4xl font-bold text-left text-white mb-8">
          Welcome to the Manager Dashboard
        </h1>
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePreviousDay}
              className="px-4 py-2 bg-white/30 backdrop-blur-md rounded-lg shadow text-gray-800 hover:bg-white/50"
            >
              {"<"} Previous
            </button>
            <h2 className="text-2xl font-semibold text-gray-900">
              {format(selectedDate, "MMMM d, yyyy")}
            </h2>
            <button
              onClick={handleNextDay}
              className="px-4 py-2 bg-white/30 backdrop-blur-md rounded-lg shadow text-gray-800 hover:bg-white/50"
            >
              Next {">"}
            </button>
          </div>
          {dailySchedules.length > 0 ? (
            <table className="w-full text-center rounded-lg overflow-hidden">
              <thead className="bg-white/30 backdrop-blur-md">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Shift Type</th>
                  <th className="p-4">Timing</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-md">
                {dailySchedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="p-4 border-b">{schedule.employeeName}</td>
                    <td className="p-4 border-b">{schedule.shiftType}</td>
                    <td className="p-4 border-b">{schedule.shiftTiming}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500">No schedules available for this day.</p>
          )}
        </div>
      </div>
    </div>
  );
}
