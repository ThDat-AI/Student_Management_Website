// src/pages/NotFound.jsx
import React, { useEffect } from 'react';

const NotFound = () => {
  useEffect(() => {
    document.title = 'Not found';
  }, []);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <h1 className="display-1 text-danger">404</h1>
        <h2 className="mb-4">Không tìm thấy trang</h2>
        <p className="mb-4">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
        <a href="/" className="btn btn-primary">Quay về trang chủ</a>
      </div>
    </div>
  );
};

export default NotFound;
