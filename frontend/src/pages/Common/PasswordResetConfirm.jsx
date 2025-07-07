// src/pages/Common/PasswordResetConfirm.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaKey } from 'react-icons/fa';
import api from '../../api';

const PasswordResetConfirm = () => {
    const [formData, setFormData] = useState({
        email: '',
        code: '',
        password: '',
        password_confirm: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Lấy email từ state được truyền qua navigate
        document.title = 'Quên mật khẩu';
        const emailFromState = location.state?.email;
        if (emailFromState) {
            setFormData(prev => ({ ...prev, email: emailFromState }));
        } else {
            // Nếu không có email, có thể người dùng vào thẳng URL này
            setError("Không tìm thấy thông tin email. Vui lòng quay lại bước trước.");
        }
    }, [location.state]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (formData.password !== formData.password_confirm) {
            setError("Mật khẩu và xác nhận mật khẩu không khớp.");
            setLoading(false);
            return;
        }

        try {
            await api.post('/api/auth/password-reset/confirm/', formData);
            setSuccess("Mật khẩu của bạn đã được đặt lại thành công! Bạn sẽ được chuyển đến trang đăng nhập.");
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error("Lỗi xác nhận đặt lại mật khẩu:", err);
            
            try {
                // Kiểm tra xem có phải lỗi network không (server không chạy)
                if (!err.response) {
                    // Lỗi network - không thể kết nối đến server
                    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                        setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.");
                    } else {
                        setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
                    }
                } else if (err.response.status === 400) {
                    // Lỗi validation từ server
                    if (err.response.data?.code) {
                        setError(err.response.data.code);
                    } else if (err.response.data?.error) {
                        setError(err.response.data.error);
                    } else {
                        setError('Mã xác nhận không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại.');
                    }
                } else if (err.response.status === 404) {
                    // Không tìm thấy yêu cầu đặt lại mật khẩu
                    setError('Không tìm thấy yêu cầu đặt lại mật khẩu. Vui lòng gửi lại yêu cầu.');
                } else if (err.response.status === 410) {
                    // Mã đã hết hạn
                    setError('Mã xác nhận đã hết hạn. Vui lòng gửi lại yêu cầu đặt lại mật khẩu.');
                } else if (err.response.status >= 500) {
                    // Lỗi server
                    setError("Server đang gặp sự cố. Vui lòng thử lại sau.");
                } else if (err.response.data?.error) {
                    setError(err.response.data.error);
                } else if (err.message) {
                    setError(err.message);
                } else {
                    setError('Đã có lỗi xảy ra. Mã xác nhận có thể không đúng hoặc đã hết hạn.');
                }
            } catch (errorHandlingError) {
                console.error("Lỗi khi xử lý lỗi:", errorHandlingError);
                setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Vô hiệu hóa form nếu không có email hoặc đã thành công
    const isFormDisabled = !formData.email || loading || !!success;

    return (
        <Container fluid className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <Row className="w-100" style={{ maxWidth: '450px' }}>
                <Col>
                    <Card className="shadow-lg border-0 rounded-4">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <FaKey size={40} className="text-primary mb-3" />
                                <h2 className="fw-bold">Đặt lại mật khẩu</h2>
                                <p className="text-muted">Nhập mã xác nhận và mật khẩu mới của bạn.</p>
                            </div>
                            
                            <Form onSubmit={handleSubmit}>
                                {error && <Alert variant="danger">{error}</Alert>}
                                {success && <Alert variant="success">{success}</Alert>}

                                <Form.Group className="mb-3" controlId="formEmail">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" name="email" value={formData.email} disabled />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formCode">
                                    <Form.Label>Mã xác nhận</Form.Label>
                                    <Form.Control type="text" name="code" placeholder="Nhập mã 6 chữ số" onChange={handleChange} required disabled={isFormDisabled} />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formPassword">
                                    <Form.Label>Mật khẩu mới</Form.Label>
                                    <Form.Control type="password" name="password" placeholder="Nhập mật khẩu mới" onChange={handleChange} required disabled={isFormDisabled} />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formPasswordConfirm">
                                    <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                    <Form.Control type="password" name="password_confirm" placeholder="Nhập lại mật khẩu mới" onChange={handleChange} required disabled={isFormDisabled} />
                                </Form.Group>
                                
                                <div className="d-grid mb-3">
                                    <Button variant="primary" type="submit" disabled={isFormDisabled} size="lg">
                                        {loading ? (<><Spinner as="span" animation="border" size="sm" /> Đang xử lý...</>) : 'Đặt lại mật khẩu'}
                                    </Button>
                                </div>

                                <div className="text-center">
                                    <Link to="/password-reset" style={{ textDecoration: 'none' }}>Chưa nhận được mã? Gửi lại</Link>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default PasswordResetConfirm;