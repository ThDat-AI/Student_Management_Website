// src/pages/Common/PasswordResetRequest.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaEnvelope } from 'react-icons/fa';
import api from '../../api';

const PasswordResetRequest = () => {
    useEffect(() => 
    {
        document.title = 'Quên mật khẩu';
    }, []);

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/api/auth/password-reset/request/', { email });
            setSuccess(`Mã xác nhận đã được gửi đến ${email}. Vui lòng kiểm tra hòm thư.`);
            // Sau khi thành công, chuyển hướng đến trang xác nhận mã
            setTimeout(() => {
                navigate('/password-reset/confirm', { state: { email: email } });
            }, 2000); // Chờ 2s để người dùng đọc thông báo
        } catch (err) {
            console.error("Lỗi đặt lại mật khẩu:", err);
            
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
                    // Lỗi validation từ server (email không hợp lệ, không tồn tại, etc.)
                    setError(err.response.data?.email || err.response.data?.error || 'Email không hợp lệ hoặc không tồn tại.');
                } else if (err.response.status === 404) {
                    // Email không tồn tại trong hệ thống
                    setError('Email này không tồn tại trong hệ thống.');
                } else if (err.response.status >= 500) {
                    // Lỗi server
                    setError("Server đang gặp sự cố. Vui lòng thử lại sau.");
                } else if (err.response.data?.email) {
                    setError(err.response.data.email);
                } else if (err.response.data?.error) {
                    setError(err.response.data.error);
                } else if (err.message) {
                    setError(err.message);
                } else {
                    setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
                }
            } catch (errorHandlingError) {
                console.error("Lỗi khi xử lý lỗi:", errorHandlingError);
                setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <Row className="w-100" style={{ maxWidth: '450px' }}>
                <Col>
                    <Card className="shadow-lg border-0 rounded-4">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <FaEnvelope size={40} className="text-primary mb-3" />
                                <h2 className="fw-bold">Quên mật khẩu</h2>
                                <p className="text-muted">Nhập email của bạn để đặt lại mật khẩu.</p>
                            </div>
                            
                            <Form onSubmit={handleSubmit}>
                                {error && <Alert variant="danger">{error}</Alert>}
                                {success && <Alert variant="success">{success}</Alert>}
                                
                                <Form.Group className="mb-4" controlId="formBasicEmail">
                                    <Form.Label>Địa chỉ Email</Form.Label>
                                    <Form.Control 
                                        type="email" 
                                        placeholder="Nhập email của bạn" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        required 
                                        disabled={loading || success}
                                    />
                                </Form.Group>
                                
                                <div className="d-grid mb-3">
                                    <Button variant="primary" type="submit" disabled={loading || success} size="lg">
                                        {loading ? (<><Spinner as="span" animation="border" size="sm" /> Gửi yêu cầu...</>) : 'Gửi mã xác nhận'}
                                    </Button>
                                </div>

                                <div className="text-center">
                                    <Link to="/login" style={{ textDecoration: 'none' }}>Quay lại đăng nhập</Link>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default PasswordResetRequest;