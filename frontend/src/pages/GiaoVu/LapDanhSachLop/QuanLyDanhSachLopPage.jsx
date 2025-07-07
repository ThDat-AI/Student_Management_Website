import React, { useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaClipboardList, FaFileExcel } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../../contexts/LayoutContext';

const QuanLyDanhSachLopPage = () => {
    const navigate = useNavigate();
    const { setPageTitle } = useLayout();

    useEffect(() => {
        document.title = "Quản lý danh sách lớp"
        setPageTitle("Quản lý danh sách lớp");
    }, [setPageTitle]);

    const subMenuItems = [
        {
            title: "Lập danh sách lớp",
            description: "Thêm, bớt và sắp xếp học sinh vào các lớp học.",
            icon: <FaClipboardList />,
            path: "/giaovu/danh-sach-lop/lap-danh-sach" // Đường dẫn mới
        },
        {
            title: "Xuất danh sách lớp",
            description: "Tải danh sách học sinh của một lớp ra file Excel.",
            icon: <FaFileExcel />,
            path: "/giaovu/danh-sach-lop/xuat-danh-sach" // Đường dẫn mới
        }
    ];

    return (
        <Container fluid className="py-4">
            <h2 className="mb-4">Quản lý Danh sách lớp</h2>
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

export default QuanLyDanhSachLopPage;