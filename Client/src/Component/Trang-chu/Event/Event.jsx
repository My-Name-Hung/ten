import React, { useEffect, useState } from "react";
import { FaArrowRight, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Event() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://ten-p521.onrender.com/events");
        const data = await response.json();
        setEvents(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDateRange = (start, end) => {
    const startDate = new Date(start).toLocaleDateString("en-GB");
    const endDate = new Date(end).toLocaleDateString("en-GB");
    return `${startDate} - ${endDate}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Hàm xử lý khi click vào nút xem chi tiết
  const handleViewDetails = (eventId) => {
    navigate(`/event-detail/${eventId}`); // Navigate to EventDetail với eventId
  };

  return (
    <div className="max-w-screen max-h-screen mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50">
      <section className="mb-36">
        <h2 className="text-2xl font-bold text-black text-center mb-6">
          Danh sách Events
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.eventid}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                {event.event_name}
              </h3>
              <p className="text-blue-600 text-sm mb-2">
                <FaCalendarAlt className="inline mr-2" />
                {formatDateRange(event.start_time, event.end_time)}
              </p>
              <p className="text-gray-700 font-medium mb-4">
                Thời gian còn lại: {event.days_remaining} ngày
              </p>

              {/* Nút Xem chi tiết */}
              <div className="mt-auto">
                <button
                  onClick={() => handleViewDetails(event.eventid)}
                  className="w-full sm:w-auto px-4 py-2 bg-red-400 hover:bg-red-600 
                    text-white font-medium rounded-lg transition-colors duration-200 
                    flex items-center justify-center space-x-2 
                    "
                >
                  <span>Xem chi tiết</span>
                  <FaArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Event;
