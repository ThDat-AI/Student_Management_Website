// src/pages/Common/Login.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaSchool, FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

const Login = () => {
    useEffect(() => {
        document.title = 'Đăng nhập hệ thống ';
    }, []);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post("/api/auth/token/", { username, password });
            
            // Dữ liệu API trả về đã được xác nhận là đúng
            const { access, refresh, user: userData } = response.data;
            
            // userData ở đây có dạng { id, Ho, Ten, role: "BGH", ... }
            if (!userData || !userData.role) {
                throw new Error("API không trả về vai trò người dùng (trường 'role' bị thiếu).");
            }

            // Truyền trực tiếp userData vào hàm login
            login(userData, access, refresh);

            const getDashboardPath = (role) => {
                switch (role) {
                    case 'BGH': return '/bgh';
                    case 'GiaoVien': return '/giaovien';
                    case 'GiaoVu': return '/giaovu';
                    default: return '/';
                }
            };
            
            // Điều hướng dựa trên userData.role
            const path = getDashboardPath(userData.role);
            navigate(path, { replace: true });
            
        } catch (err) {
            console.error("Lỗi đăng nhập:", err);
            
            try {
                // Kiểm tra xem có phải lỗi network không (server không chạy)
                if (!err.response) {
                    // Lỗi network - không thể kết nối đến server
                    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                        setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.");
                    } else {
                        setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
                    }
                } else if (err.response.status === 401) {
                    // Lỗi xác thực
                    setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
                } else if (err.response.status >= 500) {
                    // Lỗi server
                    setError("Server đang gặp sự cố. Vui lòng thử lại sau.");
                } else if (err.message) {
                    setError(err.message);
                } else {
                    setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
                }
            } catch (errorHandlingError) {
                console.error("Lỗi khi xử lý lỗi:", errorHandlingError);
                setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center min-vh-100" 
                   style={{ backgroundColor: '#f8f9fa' }}>
            <Row className="w-100" style={{ maxWidth: '450px' }}>
                <Col>
                    <Card className="shadow border-0" style={{ borderRadius: '15px' }}>
                        <Card.Header className="text-center border-0 bg-primary text-white" 
                                     style={{ borderRadius: '15px 15px 0 0', padding: '2rem' }}>
                            <div className="mb-3">
                                <div className="d-inline-flex align-items-center justify-content-center bg-white text-primary rounded-circle"
                                     style={{ width: '70px', height: '70px' }}>
                                    <FaSchool size={30} />
                                </div>
                            </div>
                            <h3 className="fw-bold mb-2">Hệ thống quản lý</h3>
                            <p className="mb-0 opacity-75">Chào mừng bạn trở lại!</p>
                        </Card.Header>

                        <Card.Body className="p-4">
                            <Form onSubmit={handleSubmit}>
                                {error && (
                                    <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                                        {error}
                                    </Alert>
                                )}
                                
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold text-secondary">
                                        <FaUser className="me-2" />
                                        Tên đăng nhập
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Nhập tên đăng nhập"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={loading}
                                        size="lg"
                                        className="border-2"
                                        style={{ borderRadius: '10px' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-semibold text-secondary">
                                        <FaLock className="me-2" />
                                        Mật khẩu
                                    </Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Nhập mật khẩu"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                            size="lg"
                                            className="border-2 pe-5"
                                            style={{ borderRadius: '10px' }}
                                        />
                                        <Button
                                            variant="link"
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            disabled={loading}
                                            className="position-absolute text-muted border-0 p-0"
                                            style={{ 
                                                right: '15px', 
                                                top: '50%', 
                                                transform: 'translateY(-50%)',
                                                background: 'none'
                                            }}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </div>
                                </Form.Group>

                                <div className="text-end mb-4">
                                    <Link to="/password-reset" className="text-decoration-none fw-semibold">
                                        Quên mật khẩu?
                                    </Link>
                                </div>

                                <div className="d-grid">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={loading}
                                        size="lg"
                                        className="fw-semibold"
                                        style={{ borderRadius: '10px', padding: '12px' }}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    className="me-2"
                                                />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            'Đăng nhập'
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    <div className="text-center mt-4">
                        <small className="text-muted">
                            © 2025 Hệ thống quản lý trường học
                        </small>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;