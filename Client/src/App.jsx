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
import AdminLogin from "./Component/Admin/AdminLogin";
import AdminDashboard from "./Component/Admin/AdminDashboard";

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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
