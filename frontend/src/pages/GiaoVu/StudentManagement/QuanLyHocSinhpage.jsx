import React, { useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaUserPlus, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../../contexts/LayoutContext';

import '../../../assets/styles/GiaoVuDashboard.css';
const QuanLyHocSinhPage = () => {
    const navigate = useNavigate();
    const { setPageTitle } = useLayout();

    useEffect(() => {
        document.title = "Quản lý học sinh";
        setPageTitle("Quản lý học sinh");
    }, [setPageTitle]);

    const subMenuItems = [
        {
            title: "Tiếp nhận học sinh",
            description: "Thêm, sửa, xóa hồ sơ học sinh mới vào hệ thống.",
            icon: <FaUserPlus />,
            path: "/giaovu/hoc-sinh/tiep-nhan" // Đường dẫn mới
        },
        {
            title: "Tra cứu học sinh",
            description: "Tìm kiếm và xem thông tin chi tiết của học sinh.",
            icon: <FaSearch />,
            path: "/giaovu/hoc-sinh/tra-cuu"
        }
    ];

    return (
        <Container fluid className="py-4">
            <h2 className="mb-4">Quản lý Học sinh</h2>
            <Row>
                {subMenuItems.map((item, index) => (
                    <Col md={6} key={index} className="mb-4">
                        <Card 
                            className="h-100 function-card-sub" 
                            onClick={() => navigate(item.path)}
                        >
                            <Card.Body className="d-flex align-items-center">
                                <div className="function-icon-sub me-4">{item.icon}</div>
                                <div>
                                    <Card.Title as="h5" className="mb-1">{item.title}</Card.Title>
                                    <Card.Text className="text-muted">{item.description}</Card.Text>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default QuanLyHocSinhPage;

