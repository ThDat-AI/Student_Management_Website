import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
// ✅ Thêm icon mới cho chức năng
import { FaUsers, FaSchool, FaClipboardList, FaChartBar, FaGraduationCap, FaGavel } from "react-icons/fa";
import { useLayout } from "../../contexts/LayoutContext";
import '../../assets/styles/GiaoVuDashboard.css';

const GiaoVuDashboard = () => {
  const navigate = useNavigate();
  const { setPageTitle } = useLayout();

  useEffect(() => {
    document.title = "Chào mừng Giáo vụ!";
    setPageTitle("Bảng điều khiển (Giáo vụ)");
  }, [setPageTitle]);

  const menuItems = [
    { 
      title: "Quản lý học sinh", 
      description: "Tiếp nhận và tra cứu thông tin học sinh.", 
      icon: <FaUsers />, 
      color: "primary", 
      path: "/giaovu/hoc-sinh/tiep-nhan"
    },
    { 
      title: "Quản lý lớp học", 
      description: "Tạo, sửa, xóa và phân công môn học cho các lớp.", 
      icon: <FaSchool />, 
      color: "success", 
      path: "/giaovu/quan-ly-lop-hoc" 
    },
    { 
      title: "Quản lý danh sách lớp", 
      description: "Sắp xếp học sinh vào lớp và xuất danh sách.", 
      icon: <FaClipboardList />, 
      color: "warning", 
      path: "/giaovu/danh-sach-lop"
    },
    { 
      title: "Tra cứu điểm số", 
      description: "Xem và xuất bảng điểm chi tiết theo lớp, môn học.", 
      icon: <FaGraduationCap />, 
      color: "danger", 
      path: "/giaovu/xem-diem"
    },
    { 
      title: "Lập báo cáo", 
      description: "Tổng kết, thống kê điểm số và kết quả học tập.", 
      icon: <FaChartBar />, 
      color: "info", 
      path: "/giaovu/baocao"
    },
    // ✅ THÊM THẺ CHỨC NĂNG MỚI
    { 
      title: "Quyền sửa điểm", 
      description: "Cho phép hoặc khóa chức năng sửa điểm của giáo viên theo học kỳ.", 
      icon: <FaGavel />, 
      color: "secondary", 
      path: "/giaovu/quyen-sua-diem"
    },
  ];

  return (
    <div className="dashboard-container">
      <Container fluid className="px-4 py-4">
        {/* Animated Banner */}
        <div className="welcome-banner p-4 rounded-4 position-relative overflow-hidden mb-4">
            <div className="banner-bg-animation">
                <div className="floating-orb orb-1"></div><div className="floating-orb orb-2"></div><div className="floating-orb orb-3"></div><div className="floating-orb orb-4"></div><div className="floating-orb orb-5"></div>
            </div>
            <div className="welcome-content d-flex align-items-center">
                <div className="banner-avatar-section me-4">
                    <div className="avatar-container">
                        <div className="avatar-main"><div className="avatar-placeholder"><FaSchool size={32} className="text-white avatar-icon" /></div></div>
                    </div>
                </div>
                <div><h2 className="text-white mb-1 fw-bold banner-title">Chào mừng, Giáo vụ!</h2><p className="text-white-75 mb-0 banner-subtitle">Hỗ trợ quản lý học sinh và lớp học hiệu quả</p></div>
            </div>
        </div>

        {/* Main Functions */}
        <div className="mb-5">
          <h5 className="fw-bold text-dark mb-3 border-start border-primary border-4 ps-2">Chức năng chính</h5>
          <Row className="g-4">
            {menuItems.map((item, index) => (
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
                      <Button variant={item.color} size="sm" className="px-3 rounded-pill" onClick={(e) => { e.stopPropagation(); navigate(item.path); }}>Truy cập</Button>
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

export default GiaoVuDashboard;