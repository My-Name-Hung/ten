import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import Login from "../src/Component/Dang-nhap/Login.jsx";
import Home from "../src/Component/Trang-chu/Home/Home.jsx";
import Reset from "../src/Component/Trang-chu/Reset/Reset.jsx";
import CustomerList from "../src/Component/Trang-chu/CustomerList/CustomerList.jsx";
import CustomerDetail from "./Component/Trang-chu/CustomerDetail/CustomerDetail.jsx";
import EventDetail from "./Component/Trang-chu/Event/EventDetail.jsx";
import Event from "./Component/Trang-chu/Event/Event.jsx";
import TranslateWidget from './Component/TranslateWidget/TranslateWidget';
import StorePhotoCapture from './Component/Trang-chu/Event/StorePhotoCapture';
import StoreGallery from './Component/Trang-chu/Event/StoreGallery';
import { TranslateWidgetProvider } from './contexts/TranslateWidgetContext';

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const ProtectedRoute = ({ element, allowedPaths }) => {
  const isLoggedIn = isAuthenticated();
  const currentPath = window.location.pathname;

  if (!isLoggedIn) {
    return <Navigate to="/" />;
  }

  // Xử lý dynamic paths (với params)
  const isPathAllowed = allowedPaths.some(path => {
    if (path.includes(':')) {
      // Nếu path có chứa params (ví dụ: :id, :eventId)
      const pathPattern = path.split('/').map(segment => {
        if (segment.startsWith(':')) {
          return '[^/]+'; // Match bất kỳ ký tự nào ngoại trừ /
        }
        return segment;
      }).join('/');
      const pathRegex = new RegExp(`^${pathPattern}$`);
      return pathRegex.test(currentPath);
    }
    // Nếu path không có params, so sánh chính xác
    return path === currentPath;
  });

  if (isPathAllowed) {
    return element;
  }

  return <Navigate to="/home" />;
};

function App() {
  return (
    <TranslateWidgetProvider>
      <BrowserRouter>
        <div className="app-container">
          <TranslateWidget />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute 
                  element={<Home />} 
                  allowedPaths={["/home"]} 
                />
              }
            />
            <Route
              path="/doi-mat-khau"
              element={
                <ProtectedRoute 
                  element={<Reset />} 
                  allowedPaths={["/doi-mat-khau"]} 
                />
              }
            />
            <Route
              path="/danh-sach-khach-hang"
              element={
                <ProtectedRoute
                  element={<CustomerList />}
                  allowedPaths={["/danh-sach-khach-hang"]}
                />
              }
            />
            <Route
              path="/customer-detail/:id"
              element={
                <ProtectedRoute
                  element={<CustomerDetail />}
                  allowedPaths={["/customer-detail/:id", "/danh-sach-khach-hang"]} // Thêm cả path gốc
                />
              }
            />
            <Route
              path="/event"
              element={
                <ProtectedRoute
                  element={<Home />}
                  allowedPaths={["/event"]}
                />
              }
            />
            <Route
              path="/event-detail/:eventId"
              element={
                <ProtectedRoute
                  element={<EventDetail />}
                  allowedPaths={["/event-detail/:eventId"]}
                />
              }
            />
            <Route path="/store-photo-capture/:eventId/:storeId" element={<StorePhotoCapture />} />
            <Route path="/store-gallery/:eventId/:storeId" element={<StoreGallery />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TranslateWidgetProvider>
  );
}

export default App;
