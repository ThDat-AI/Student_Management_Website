import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { FaChartBar, FaChartLine } from "react-icons/fa";
import "../../assets/styles/GiaoVuDashboard.css";

const BaoCaoThongKe = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Báo cáo thống kê";
  }, []);
  const reportItems = [
    {
      title: "Báo cáo tổng kết môn học",
      description: "Xem thống kê theo từng môn học, lớp và tỷ lệ đạt.",
      icon: <FaChartBar />,
      color: "primary",
      path: "/giaovu/baocao-monhoc",
    },
    {
      title: "Báo cáo tổng kết học kỳ",
      description: "Tổng hợp kết quả học tập toàn bộ lớp trong học kỳ.",
      icon: <FaChartLine />,
      color: "success",
      path: "/giaovu/baocao-hocky",
    },
  ];

  return (
    <div className="dashboard-container">
      <Container fluid className="px-4 py-4">
        {/* Banner giữ nguyên */}
        <div className="welcome-banner p-4 rounded-4 position-relative overflow-hidden mb-4">
          <div className="banner-bg-animation">
            <div className="floating-orb orb-1"></div>
            <div className="floating-orb orb-2"></div>
            <div className="floating-orb orb-3"></div>
            <div className="floating-orb orb-4"></div>
            <div className="floating-orb orb-5"></div>
          </div>
          <div className="grid-pattern"></div>
          <div className="wave-animation">
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
            <div className="wave wave-3"></div>
          </div>
          <div className="particles">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
            <div className="particle particle-5"></div>
            <div className="particle particle-6"></div>
          </div>
          <div className="shimmer-effect"></div>
          <div className="welcome-content d-flex align-items-center">
            <div className="banner-avatar-section me-4">
              <div className="avatar-container">
                <div className="avatar-main">
                  <div className="avatar-placeholder">
                    <FaChartLine size={32} className="text-white avatar-icon" />
                  </div>
                </div>
                <div className="avatar-ring ring-1"></div>
                <div className="avatar-ring ring-2"></div>
                <div className="avatar-pulse pulse-1"></div>
                <div className="avatar-pulse pulse-2"></div>
                <div className="avatar-glow"></div>
              </div>
            </div>
            <div>
              <h2 className="text-white mb-1 fw-bold banner-title">Báo cáo & Thống kê</h2>
              <p className="text-white-75 mb-0 banner-subtitle">Chọn loại báo cáo cần xem hoặc xuất</p>
            </div>
          </div>
        </div>

        {/* Giao diện như Dashboard */}
        <div>
          <h5 className="fw-bold text-dark mb-3 border-start border-primary border-4 ps-2">Chọn loại báo cáo</h5>
          <Row className="g-4">
            {reportItems.map((item, index) => (
              <Col xs={12} md={6} xl={4} key={index}>
                <Card className="function-card h-100 border-0 shadow-sm" onClick={() => navigate(item.path)}>
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      <div className={`function-icon p-3 bg-${item.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center`}>
                        {React.cloneElement(item.icon, { size: 24, className: `text-${item.color}` })}
                      </div>
                      <h5 className="fw-bold mb-0 ms-3">{item.title}</h5>
                    </div>
                    <p className="text-muted mb-3 lh-base flex-grow-1">{item.description}</p>
                    <div className="text-end mt-auto">
                      <Button variant={item.color} size="sm" className="px-3 rounded-pill" onClick={(e) => { e.stopPropagation(); navigate(item.path); }}>
                        Truy cập
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default BaoCaoThongKe;
