// src/pages/BGH/StudentManagement/components/StudentModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import api from '../../../../api/index';
import { toast } from 'react-toastify';

const StudentModal = ({ show, onHide, modalType, studentData, onSubmit }) => {
    const isEditMode = modalType === 'edit';
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(''); // Đã loại bỏ
    const [nienKhoas, setNienKhoas] = useState([]);
    const [khois, setKhois] = useState([]);
    
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [nkRes, khoiRes] = await Promise.all([
                    api.get('/api/students/filters/nienkhoa/'),
                    api.get('/api/students/filters/khoi/'),
                ]);
                setNienKhoas(nkRes.data);
                setKhois(khoiRes.data);
            } catch (err) {
                console.error("Lỗi tải dữ liệu dropdown:", err);
                toast.error("Không thể tải dữ liệu cần thiết cho form. Vui lòng thử lại.");
            }
        };
        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (isEditMode && studentData) {
            setFormData({
                ...studentData,
                NgaySinh: studentData.NgaySinh ? new Date(studentData.NgaySinh).toISOString().split('T')[0] : '',
                IDNienKhoaTiepNhan: studentData.IDNienKhoaTiepNhan?.id || studentData.IDNienKhoaTiepNhan || '',
                KhoiDuKien: studentData.KhoiDuKien?.id || studentData.KhoiDuKien || '',
            });
        } else {
            setFormData({
                Ho: '', Ten: '', GioiTinh: 'Nam', NgaySinh: '', DiaChi: '', Email: '',
                IDNienKhoaTiepNhan: '', KhoiDuKien: ''
            });
        }
    }, [show, modalType, studentData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.NgaySinh || !formData.IDNienKhoaTiepNhan || !formData.GioiTinh || !formData.Ho || !formData.Ten || !formData.DiaChi) {
            toast.warn('Vui lòng điền đầy đủ các trường có dấu (*).');
            return false;
        }

        if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
            toast.warn('Địa chỉ Email không hợp lệ.');
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

        try {
            const dataToSend = {
                ...formData,
                IDNienKhoaTiepNhan: Number(formData.IDNienKhoaTiepNhan),
                KhoiDuKien: formData.KhoiDuKien ? Number(formData.KhoiDuKien) : null,
            };

            // Gọi hàm submit từ cha. Cha sẽ xử lý toast và đóng modal.
            await onSubmit(dataToSend, studentData?.id);
            setLoading(false);

        } catch (err) {
            setLoading(false);
            // Lỗi không mong muốn trong quá trình chuẩn bị dữ liệu
            toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
            console.error("Lỗi submit:", err);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
            <Form onSubmit={handleFormSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditMode ? `Chỉnh sửa: ${studentData?.Ho} ${studentData?.Ten}` : 'Thêm học sinh mới'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* Alert đã được xóa */}
                    
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
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Niên khóa tiếp nhận *</Form.Label><Form.Select name="IDNienKhoaTiepNhan" value={formData.IDNienKhoaTiepNhan || ''} onChange={handleInputChange} required><option value="">Chọn niên khóa</option>{nienKhoas.map(nk => (<option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>))}</Form.Select></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Khối dự kiến</Form.Label><Form.Select name="KhoiDuKien" value={formData.KhoiDuKien || ''} onChange={handleInputChange}><option value="">Không chọn</option>{khois.map(khoi => (<option key={khoi.id} value={khoi.id}>{khoi.TenKhoi}</option>))}</Form.Select></Form.Group></Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : null}
                        {isEditMode ? 'Lưu thay đổi' : 'Thêm học sinh'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default StudentModal;