// src/pages/BGH/AccountManagement/components/AccountModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';

const AccountModal = ({ show, onHide, modalType, accountData, roles, onSubmit }) => {
    const isEditMode = modalType === 'edit';

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const initialFormState = {
            username: '', password: '', Ho: '', Ten: '', MaVaiTro: '',
            GioiTinh: 'Nam', NgaySinh: '', DiaChi: '', SoDienThoai: '', Email: ''
        };

        if (isEditMode && accountData) {
            const roleCode = accountData?.MaVaiTro?.MaVaiTro || accountData?.MaVaiTro;
            setFormData({
                username: accountData.user?.username || '',
                password: '',
                Ho: accountData.Ho || '',
                Ten: accountData.Ten || '',
                MaVaiTro: roleCode || '',
                GioiTinh: accountData.GioiTinh || 'Nam',
                NgaySinh: accountData.NgaySinh ? new Date(accountData.NgaySinh).toISOString().split('T')[0] : '',
                DiaChi: accountData.DiaChi || '',
                SoDienThoai: accountData.SoDienThoai || '',
                Email: accountData.Email || ''
            });
        } else {
            setFormData(initialFormState);
        }
    }, [show, modalType, accountData]);

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Component cha (AccountManagement) sẽ xử lý kết quả và hiển thị toast
        await onSubmit(formData, accountData?.id);
        
        setLoading(false);

        // Nếu thành công, component cha sẽ tự đóng modal.
        // Nếu thất bại, component cha đã hiển thị toast và modal vẫn mở.
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
            <Form onSubmit={handleFormSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditMode ? `Chỉnh sửa: ${accountData?.Ho} ${accountData?.Ten}` : 'Tạo tài khoản mới'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tên đăng nhập *</Form.Label>
                                <Form.Control type="text" name="username" value={formData.username || ''} onChange={handleInputChange} required disabled={isEditMode} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Mật khẩu {isEditMode ? '(để trống nếu không đổi)' : '*'}</Form.Label>
                                <Form.Control type="password" name="password" value={formData.password || ''} onChange={handleInputChange} required={!isEditMode} minLength={!isEditMode ? 8 : undefined} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ *</Form.Label><Form.Control type="text" name="Ho" value={formData.Ho || ''} onChange={handleInputChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Tên *</Form.Label><Form.Control type="text" name="Ten" value={formData.Ten || ''} onChange={handleInputChange} required /></Form.Group></Col>
                    </Row>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Vai trò *</Form.Label><Form.Select name="MaVaiTro" value={formData.MaVaiTro || ''} onChange={handleInputChange} required><option value="">Chọn vai trò</option>{roles.map(role => (<option key={role.MaVaiTro} value={role.MaVaiTro}>{role.TenVaiTro}</option>))}</Form.Select></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Giới tính *</Form.Label><Form.Select name="GioiTinh" value={formData.GioiTinh || 'Nam'} onChange={handleInputChange} required><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></Form.Select></Form.Group></Col>
                    </Row>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Ngày sinh *</Form.Label><Form.Control type="date" name="NgaySinh" value={formData.NgaySinh || ''} onChange={handleInputChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại *</Form.Label><Form.Control type="tel" name="SoDienThoai" value={formData.SoDienThoai || ''} onChange={handleInputChange} required /></Form.Group></Col>
                    </Row>
                    <Row>
                        <Col md={12}><Form.Group className="mb-3"><Form.Label>Email *</Form.Label><Form.Control type="email" name="Email" value={formData.Email || ''} onChange={handleInputChange} required /></Form.Group></Col>
                        <Col md={12}><Form.Group className="mb-3"><Form.Label>Địa chỉ *</Form.Label><Form.Control as="textarea" rows={2} name="DiaChi" value={formData.DiaChi || ''} onChange={handleInputChange} required /></Form.Group></Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner as="span" size="sm" /> : (isEditMode ? 'Cập nhật' : 'Tạo mới')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AccountModal;