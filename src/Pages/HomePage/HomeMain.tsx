import React from "react";
import "../css/HomeMain.css"; // Sửa lại đường dẫn cho đúng

// Main App component
export default function App() {
  return (
    <div className="top-bar-container">
      {/* Announcement Banner */}
      <div className="announcement-banner">
        <h3>
          MỚI! Bạn đang lập kế hoạch cho các sự kiện kinh doanh? Đăng ký gói
          Paperless Pro và tiết kiệm 10% với mã PRO10.{" "}
          <a href="#">Tìm hiểu thêm.</a>
        </h3>
      </div>

      {/* Header Row */}
      <div className="header-row">
        <div className="header-left">
          <div className="logo">LOGO</div>
          <a href="#" className="pro-link">
            CHUYÊN NGHIỆP
          </a>
        </div>
        <div className="header-right">
          <input type="text" placeholder="Tìm kiếm" className="search-input" />
          <a href="#" className="auth-link">
            Đăng nhập
          </a>
          <a href="#" className="auth-link">
            Đăng ký
          </a>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="navigation-bar">
        <div className="nav-bar-content">
          <nav>
            <ul className="nav-links">
              <li>
                <a href="#">THIỆP MỜI</a>
              </li>
              <li>
                <a href="#">THIỆP CHÚC MỪNG</a>
              </li>
              <li>
                <a href="#">THIỆP CẢM ƠN</a>
              </li>
              <li>
                <a href="#">THIỆP KHÁC</a>
              </li>
              <li>
                <a href="#">CỬA HÀNG – DỊCH VỤ</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
