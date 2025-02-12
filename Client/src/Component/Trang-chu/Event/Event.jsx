import React, { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa"; // Import the icon

function Event() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("https://ten-server.onrender.com/events"); // Replace with your backend URL
        if (!response.ok) {
          throw new Error("Failed to fetch events.");
        }
        const data = await response.json();
        setEvents(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  const formatDateRange = (start, end) => {
    const startDate = new Date(start).toLocaleDateString("en-GB");
    const endDate = new Date(end).toLocaleDateString("en-GB");
    return `${startDate} - ${endDate}`;
  };

  const getEventStatus = (daysRemaining) => {
    if (daysRemaining > 0) return "Đang hoạt động";
    if (daysRemaining === 0) return "Đã kết thúc";
    return "Đã kết thúc";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="text-lg font-medium">Loading Events...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <h2 className="text-2xl font-semibold text-orange-600">
          Không có Events nào
        </h2>
        <p className="text-gray-500 mt-2">Liên hệ Admin để kiểm tra lại!</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
        Danh sách Events
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {events.map((event) => (
          <div
            key={event.eventid}
            className="p-5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between h-full"
          >
            <div className="flex-grow">
              <h3 className="text-lg font-semibold">{event.event_name}</h3>
              <p className="text-sm mt-2">
                <strong>Thời gian:</strong>{" "}
                {formatDateRange(event.start_time, event.end_time)}
              </p>
              <p className="text-sm">
                <strong>Trạng thái:</strong>{" "}
                <span
                  className={`${
                    getEventStatus(event.days_remaining) === "Đang hoạt động"
                      ? "text-blue-800"
                      : getEventStatus(event.days_remaining) === "Đã kết thúc"
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                >
                  {getEventStatus(event.days_remaining)}
                </span>
              </p>
            </div>
            <div className="mt-4">
              <div className="text-lg font-bold text-red-600">
                Thời gian còn lại: {event.days_remaining} ngày
              </div>
              <button className="mt-4 px-4 py-2 bg-blue-800 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition flex items-center justify-center">
                Xem chi tiết
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Event;
