// StudentModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';

const StudentModal = ({ show, onHide, modalType, studentData, onSubmit, nienKhoas, khois, currentNienKhoaId }) => {
    const isEditMode = modalType === 'edit';
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!show) return;

        setError('');
        const initialData = {
            Ho: '', Ten: '', GioiTinh: 'Nam', NgaySinh: '', DiaChi: '', Email: '',
            KhoiDuKien: khois.length > 0 ? khois[0].id : ''
        };

        if (isEditMode && studentData) {
            setFormData({
                ...studentData,
                NgaySinh: studentData.NgaySinh ? new Date(studentData.NgaySinh).toISOString().split('T')[0] : '',
                KhoiDuKien: studentData.KhoiDuKien?.id || studentData.KhoiDuKien || '',
            });
        } else {
            setFormData(initialData);
        }
    }, [show, modalType, studentData, khois]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const validateForm = () => {
        const requiredFields = {Ho: 'Họ', Ten: 'Tên', NgaySinh: 'Ngày sinh', DiaChi: 'Địa chỉ', KhoiDuKien: 'Khối dự kiến'};
        for (const field in requiredFields) {
            if (!formData[field]) {
                setError(`Vui lòng điền đầy đủ thông tin. Trường "${requiredFields[field]}" đang bị trống.`);
                return false;
            }
        }
        if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
            setError('Địa chỉ Email không hợp lệ.');
            return false;
        }
        return true;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;
        
        setLoading(true);
        // Chỉ gửi dữ liệu thô, không kèm ID niên khóa
        const dataToSend = { ...formData };
        if(isEditMode) dataToSend.IDNienKhoaTiepNhan = studentData.IDNienKhoaTiepNhan;
        
        await onSubmit(dataToSend, studentData?.id);
        setLoading(false);
    };
    
    const nienKhoaHienHanh = nienKhoas.find(nk => nk.id === currentNienKhoaId);

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
            <Form onSubmit={handleFormSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? `Chỉnh sửa: ${studentData?.Ho} ${studentData?.Ten}` : 'Thêm học sinh mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ *</Form.Label><Form.Control type="text" name="Ho" value={formData.Ho || ''} onChange={handleInputChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Tên *</Form.Label><Form.Control type="text" name="Ten" value={formData.Ten || ''} onChange={handleInputChange} required /></Form.Group></Col>
                    </Row>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Ngày sinh *</Form.Label><Form.Control type="date" name="NgaySinh" value={formData.NgaySinh || ''} onChange={handleInputChange} required max={new Date().toISOString().split('T')[0]} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Giới tính *</Form.Label><Form.Select name="GioiTinh" value={formData.GioiTinh || 'Nam'} onChange={handleInputChange} required><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></Form.Select></Form.Group></Col>
                    </Row>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="Email" value={formData.Email || ''} onChange={handleInputChange} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Địa chỉ *</Form.Label><Form.Control as="textarea" rows={1} name="DiaChi" value={formData.DiaChi || ''} onChange={handleInputChange} required /></Form.Group></Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Niên khóa tiếp nhận *</Form.Label>
                                <Form.Control type="text" value={nienKhoaHienHanh?.TenNienKhoa || 'N/A'} disabled />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Khối dự kiến *</Form.Label>
                                <Form.Select name="KhoiDuKien" value={formData.KhoiDuKien || ''} onChange={handleInputChange} required>
                                    {khois.length === 0 ? (<option value="">Không có khối nào</option>) : (khois.map(khoi => (<option key={khoi.id} value={khoi.id}>{khoi.TenKhoi}</option>)))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading && <Spinner as="span" animation="border" size="sm" className="me-2" />}
                        {isEditMode ? 'Lưu thay đổi' : 'Thêm học sinh'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default StudentModal;