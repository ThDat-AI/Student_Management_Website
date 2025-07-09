import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import api from '../../../../api/index';
import { toast } from 'react-toastify';

const StudentModal = ({ show, onHide, modalType, studentData, onSubmit, nienKhoas }) => {
    const isEditMode = modalType === 'edit';
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [khois, setKhois] = useState([]);
    
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const khoiRes = await api.get('/api/students/filters/khoi/');
                setKhois(khoiRes.data);
            } catch (err) {
                toast.error("Không thể tải dữ liệu khối.");
            }
        };
        if (show) {
            fetchDropdownData();
        }
    }, [show]);

    useEffect(() => {
        setError(''); // Reset lỗi khi mở lại modal
        const currentNienKhoa = nienKhoas.find(nk => nk.is_current);
        if (isEditMode && studentData) {
            setFormData({
                ...studentData,
                NgaySinh: studentData.NgaySinh ? new Date(studentData.NgaySinh).toISOString().split('T')[0] : '',
                IDNienKhoaTiepNhan: studentData.IDNienKhoaTiepNhan?.id || studentData.IDNienKhoaTiepNhan || '',
                KhoiDuKien: studentData.KhoiDuKien?.id || studentData.KhoiDuKien || '',
            });
        } else {
            setFormData({
                Ho: '', 
                Ten: '', 
                GioiTinh: 'Nam', 
                NgaySinh: '', 
                DiaChi: '', 
                Email: '',
                IDNienKhoaTiepNhan: currentNienKhoa?.id || '', 
                KhoiDuKien: khois.length > 0 ? khois[0].id : '' // Đặt giá trị mặc định là khối đầu tiên nếu có
            });
        }
    }, [show, modalType, studentData, nienKhoas, khois]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(''); // Xóa thông báo lỗi khi người dùng bắt đầu sửa
    };

    const validateForm = () => {
        const requiredFields = ['Ho', 'Ten', 'NgaySinh', 'GioiTinh', 'DiaChi', 'IDNienKhoaTiepNhan', 'KhoiDuKien'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                setError(`Vui lòng điền đầy đủ thông tin. Trường "${field === 'KhoiDuKien' ? 'Khối dự kiến' : field}" đang bị trống.`);
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
        const dataToSend = {
            ...formData,
            IDNienKhoaTiepNhan: Number(formData.IDNienKhoaTiepNhan),
            KhoiDuKien: Number(formData.KhoiDuKien),
        };
        
        await onSubmit(dataToSend, studentData?.id);
        setLoading(false);
    };
    
    const selectedNienKhoaObj = nienKhoas.find(nk => nk.id === formData.IDNienKhoaTiepNhan);

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
            <Form onSubmit={handleFormSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? `Chỉnh sửa: ${studentData?.Ho} ${studentData?.Ten}` : 'Thêm học sinh mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Họ *</Form.Label>
                                <Form.Control type="text" name="Ho" value={formData.Ho || ''} onChange={handleInputChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tên *</Form.Label>
                                <Form.Control type="text" name="Ten" value={formData.Ten || ''} onChange={handleInputChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ngày sinh *</Form.Label>
                                <Form.Control 
                                    type="date" 
                                    name="NgaySinh" 
                                    value={formData.NgaySinh || ''} 
                                    onChange={handleInputChange} 
                                    required 
                                    max={new Date().toISOString().split('T')[0]} 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Giới tính *</Form.Label>
                                <Form.Select 
                                    name="GioiTinh" 
                                    value={formData.GioiTinh || 'Nam'} 
                                    onChange={handleInputChange} 
                                    required
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    name="Email" 
                                    value={formData.Email || ''} 
                                    onChange={handleInputChange} 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Địa chỉ *</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={1} 
                                    name="DiaChi" 
                                    value={formData.DiaChi || ''} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Niên khóa tiếp nhận *</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={selectedNienKhoaObj?.TenNienKhoa || ''} 
                                    disabled 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Khối dự kiến *</Form.Label>
                                <Form.Select 
                                    name="KhoiDuKien" 
                                    value={formData.KhoiDuKien || ''} 
                                    onChange={handleInputChange} 
                                    required
                                >
                                    {khois.length === 0 ? (
                                        <option value="">Đang tải...</option>
                                    ) : (
                                        khois.map(khoi => (
                                            <option key={khoi.id} value={khoi.id}>
                                                {khoi.TenKhoi}
                                            </option>
                                        ))
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>
                        Hủy
                    </Button>
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