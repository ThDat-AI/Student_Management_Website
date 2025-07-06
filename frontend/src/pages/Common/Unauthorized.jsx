// src/pages/Common/Unauthorized.jsx
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div className="text-center p-4 border rounded shadow-sm bg-white">
        <h1 className="text-danger mb-3">
          <i className="bi bi-exclamation-triangle-fill"></i> {/* Bootstrap Icons */}
        </h1>
        <h3 className="mb-4">Bạn không có quyền truy cập trang này.</h3>
        <Button variant="primary" onClick={() => navigate('/')}>
          Quay về trang chủ
        </Button>
      </div>
    </div>
  );
}

export default Unauthorized;
