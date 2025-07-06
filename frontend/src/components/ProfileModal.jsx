// src/components/ProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../api';

const ProfileModal = ({ show, onHide }) => {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mapping các field tiếng Việt
  const fieldLabels = {
    Ho: 'Họ',
    Ten: 'Tên',
    GioiTinh: 'Giới tính',
    NgaySinh: 'Ngày sinh',
    SoDienThoai: 'Số điện thoại',
    Email: 'Email',
    DiaChi: 'Địa chỉ',
    old_password: 'Mật khẩu cũ',
    password: 'Mật khẩu mới',
    password_confirm: 'Xác nhận mật khẩu',
    username: 'Tên đăng nhập'
  };

  // Hàm xử lý thông báo lỗi chi tiết
  const formatErrorMessage = (errorData) => {
    if (typeof errorData === 'string') {
      return errorData;
    }

    if (typeof errorData === 'object' && errorData !== null) {
      const errorMessages = [];
      
      Object.entries(errorData).forEach(([field, messages]) => {
        const fieldLabel = fieldLabels[field] || field;
        let messageList = Array.isArray(messages) ? messages : [messages];
        
        messageList.forEach(message => {
          // Xử lý các thông báo lỗi phổ biến
          let translatedMessage = message;
          
          if (typeof message === 'string') {
            // Dịch các thông báo lỗi thường gặp
            if (message.includes('required') || message.includes('This field is required')) {
              translatedMessage = 'không được để trống';
            } else if (message.includes('invalid') || message.includes('Enter a valid')) {
              translatedMessage = 'không hợp lệ';
            } else if (message.includes('already exists') || message.includes('already taken')) {
              translatedMessage = 'đã tồn tại trong hệ thống';
            } else if (message.includes('too short')) {
              translatedMessage = 'quá ngắn';
            } else if (message.includes('too long')) {
              translatedMessage = 'quá dài';
            } else if (message.includes('password') && message.includes('common')) {
              translatedMessage = 'quá đơn giản, vui lòng chọn mật khẩu phức tạp hơn';
            } else if (message.includes('password') && message.includes('numeric')) {
              translatedMessage = 'không được chỉ chứa số';
            } else if (message.includes('password') && message.includes('similar')) {
              translatedMessage = 'không được giống với thông tin cá nhân';
            } else if (message.includes('Incorrect password')) {
              translatedMessage = 'không chính xác';
            } else if (message.includes('email') && message.includes('invalid')) {
              translatedMessage = 'không đúng định dạng email';
            }
          }
          
          errorMessages.push(`${fieldLabel}: ${translatedMessage}`);
        });
      });
      
      return errorMessages.join('\n');
    }

    return 'Có lỗi xảy ra, vui lòng thử lại';
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!show) return;
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const response = await api.get('/api/accounts/me/'); 
        setFormData({
            ...response.data,
            old_password: '',
            password: '',
            password_confirm: '',
        });
      } catch (err) {
        console.error('Fetch user data error:', err);
        if (err.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (err.response?.status === 403) {
          setError('Bạn không có quyền truy cập thông tin này.');
        } else if (err.response?.status === 500) {
          setError('Lỗi server. Vui lòng thử lại sau.');
        } else {
          setError('Không thể tải thông tin cá nhân. Vui lòng kiểm tra kết nối internet và thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa thông báo lỗi khi user bắt đầu nhập
    if (error) setError('');
  };

  const validateForm = () => {
    // Kiểm tra validation phía client
    if (formData.password && formData.password !== formData.password_confirm) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return false;
    }

    if (formData.password && !formData.old_password) {
      setError('Vui lòng nhập mật khẩu cũ để thay đổi mật khẩu.');
      return false;
    }

    if (formData.password && formData.password.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return false;
    }

    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const { id, username, MaVaiTro, ...updateData } = formData;

    if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.old_password;
        delete updateData.password;
        delete updateData.password_confirm;
    }
    
    try {
      await api.patch('/api/accounts/me/', updateData); 
      setSuccess('Cập nhật thông tin thành công!');
      setTimeout(() => onHide(), 1500);
    } catch (err) {
      console.error('Update profile error:', err);
      
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        setError(formatErrorMessage(errorData));
      } else if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 403) {
        setError('Bạn không có quyền thực hiện thao tác này.');
      } else if (err.response?.status === 429) {
        setError('Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.');
      } else if (err.response?.status >= 500) {
        setError('Lỗi server. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.');
      } else {
        setError('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Thông tin cá nhân</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleFormSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              <Alert.Heading>Có lỗi xảy ra</Alert.Heading>
              <div style={{ whiteSpace: 'pre-line' }}>{error}</div>
            </Alert>
          )}
          {success && <Alert variant="success">{success}</Alert>}
          
          {loading && !formData ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <div className="mt-2">Đang tải thông tin...</div>
            </div>
          ) : formData && (
            <>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Họ *</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="Ho" 
                      value={formData.Ho} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên *</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="Ten" 
                      value={formData.Ten} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giới tính *</Form.Label>
                    <Form.Select 
                      name="GioiTinh" 
                      value={formData.GioiTinh} 
                      onChange={handleInputChange} 
                      required
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày sinh *</Form.Label>
                    <Form.Control 
                      type="date" 
                      name="NgaySinh" 
                      value={formData.NgaySinh} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số điện thoại *</Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="SoDienThoai" 
                      value={formData.SoDienThoai} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control 
                      type="email" 
                      name="Email" 
                      value={formData.Email} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Địa chỉ *</Form.Label>
                <Form.Control 
                  type="text" 
                  name="DiaChi" 
                  value={formData.DiaChi} 
                  onChange={handleInputChange} 
                  required 
                />
              </Form.Group>
              <hr/>
              <p className="text-muted">Đổi mật khẩu (để trống nếu không muốn thay đổi)</p>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu cũ</Form.Label>
                    <Form.Control 
                      type="password" 
                      name="old_password" 
                      value={formData.old_password} 
                      onChange={handleInputChange} 
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu mới</Form.Label>
                    <Form.Control 
                      type="password" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                    />
                    <Form.Text className="text-muted">
                      Tối thiểu 8 ký tự
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Xác nhận mật khẩu</Form.Label>
                    <Form.Control 
                      type="password" 
                      name="password_confirm" 
                      value={formData.password_confirm} 
                      onChange={handleInputChange} 
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProfileModal;