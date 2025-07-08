import React, { useState, useEffect } from 'react';
import { Container, Form, Spinner, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaGavel, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../api';
import { useLayout } from '../../contexts/LayoutContext';

const QuanLyQuyenSuaDiem = () => {
    const [quyDinh, setQuyDinh] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setPageTitle } = useLayout();

    useEffect(() => {
        document.title = "Quản lý quyền sửa điểm";
        setPageTitle("Quản lý quyền sửa điểm");
        fetchLatestQuyDinh();
    }, [setPageTitle]);

    const fetchLatestQuyDinh = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/configurations/quydinh/settings/latest/');
            setQuyDinh(res.data);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Lỗi khi tải cài đặt.";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleChange = async (field, value) => {
        const originalQuyDinh = { ...quyDinh };
        setQuyDinh(prev => ({ ...prev, [field]: value }));
        try {
            await api.patch('/api/configurations/quydinh/settings/latest/', { [field]: value });
            toast.success("Cập nhật thành công!");
        } catch (err) {
            setQuyDinh(originalQuyDinh);
            toast.error("Cập nhật thất bại: " + (err.response?.data?.detail || err.message));
        }
    };

    const renderContent = () => {
        if (loading) return <div className="text-center my-4"><Spinner animation="border" /></div>;
        if (error) return <Alert variant="danger">{error}</Alert>;
        if (!quyDinh) return <Alert variant="info">Không có dữ liệu quy định.</Alert>;
        
        return (
            <Card>
                <Card.Header as="h5" className="bg-primary text-white">
                    Niên khóa hiện tại: {quyDinh.TenNienKhoa}
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-center mb-3 p-2 border-bottom">
                        <Col><span className="fw-bold">Cho phép sửa điểm Học kỳ 1</span></Col>
                        <Col xs="auto" className="d-flex align-items-center">
                            {quyDinh.ChoPhepSuaDiemHK1 ? <FaCheckCircle className="text-success me-2" /> : <FaTimesCircle className="text-danger me-2" />}
                            <Form.Check type="switch" id="switch-hk1" checked={quyDinh.ChoPhepSuaDiemHK1} onChange={(e) => handleToggleChange('ChoPhepSuaDiemHK1', e.target.checked)} />
                        </Col>
                    </Row>
                    <Row className="align-items-center p-2">
                        <Col><span className="fw-bold">Cho phép sửa điểm Học kỳ 2</span></Col>
                        <Col xs="auto" className="d-flex align-items-center">
                            {quyDinh.ChoPhepSuaDiemHK2 ? <FaCheckCircle className="text-success me-2" /> : <FaTimesCircle className="text-danger me-2" />}
                            <Form.Check type="switch" id="switch-hk2" checked={quyDinh.ChoPhepSuaDiemHK2} onChange={(e) => handleToggleChange('ChoPhepSuaDiemHK2', e.target.checked)} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    return (
        <Container fluid className="px-4 py-4">
             <div className="welcome-banner p-4 rounded-4 position-relative overflow-hidden mb-4">
                {/* ... banner ... */}
            </div>
            {renderContent()}
        </Container>
    );
};

export default QuanLyQuyenSuaDiem;