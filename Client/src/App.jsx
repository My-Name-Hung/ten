import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Login from "../src/Component/Dang-nhap/Login.jsx";
import Home from "../src/Component/Trang-chu/Home/Home.jsx";
import Reset from "../src/Component/Trang-chu/Reset/Reset.jsx"
import CustomerList from "../src/Component/Trang-chu/CustomerList/CustomerList.jsx";
import Event from "./Component/Trang-chu/Event/Event";
import EventDetail from "./Component/Trang-chu/Event/EventDetail";

const isAuthenticated = () => {
  return !!localStorage.getItem("token"); // Kiểm tra token trong localStorage
};

const ProtectedRoute = ({ element, allowedPaths }) => {
  const isLoggedIn = isAuthenticated();
  const currentPath = window.location.pathname;

  if (!isLoggedIn) {
    return <Navigate to="/" />;
  }

  // Nếu người dùng đã đăng nhập và truy cập các đường dẫn được phép
  if (allowedPaths && allowedPaths.includes(currentPath)) {
    return element;
  }

  // Với các đường dẫn không được phép hoặc khi không có token
  return <Navigate to="/home" />;
};


const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  {
    path: "/home",
    element: <ProtectedRoute element={<Home />} allowedPaths={["/home"]} />, // Yêu cầu xác thực
  },
  {
    path: "/doi-mat-khau",
    element: (
      <ProtectedRoute element={<Reset />} allowedPaths={["/doi-mat-khau"]} />
    ), // Không cần đăng nhập lại
  },
]);


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<ProtectedRoute element={<Home />} allowedPaths={["/home"]} />} />
        <Route path="/doi-mat-khau" element={<ProtectedRoute element={<Reset />} allowedPaths={["/doi-mat-khau"]} />} />
        <Route path="/danh-sach-khach-hang" element={<ProtectedRoute element={<CustomerList />} allowedPaths={["/danh-sach-khach-hang"]} />} />
        <Route path="/event" element={<Event />} />
        <Route path="/event-detail/:eventId" element={<EventDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
