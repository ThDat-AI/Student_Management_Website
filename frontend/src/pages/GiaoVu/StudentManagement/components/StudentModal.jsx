// src/pages/GiaoVu/StudentManagement/components/StudentModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../../../../api/index'; // Đường dẫn API tương đối

const StudentModal = ({ show, onHide, modalType, studentData, onSubmit }) => {
    const isEditMode = modalType === 'edit';
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [nienKhoas, setNienKhoas] = useState([]); // Danh sách niên khóa cho dropdown
    const [khois, setKhois] = useState([]);         // Danh sách khối cho dropdown
    const [latestQuyDinh, setLatestQuyDinh] = useState(null); // Quy định mới nhất để kiểm tra tuổi

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [nkRes, khoiRes, qdRes] = await Promise.all([
                    api.get('/api/students/filters/nienkhoa/'),
                    api.get('/api/students/filters/khoi/'),
                    api.get('/api/configurations/quydinh/latest/')
                ]);
                setNienKhoas(nkRes.data);
                setKhois(khoiRes.data);
                setLatestQuyDinh(Object.keys(qdRes.data).length > 0 ? qdRes.data : null);
            } catch (err) {
                console.error("Lỗi tải dữ liệu dropdown:", err);
                setError("Không thể tải dữ liệu cần thiết. Vui lòng thử lại.");
            }
        };
        fetchDropdownData();
    }, []);

    useEffect(() => {
        setError('');
        if (isEditMode && studentData) {
            setFormData({
                ...studentData,
                // Định dạng ngày sinh cho input type="date"
                NgaySinh: studentData.NgaySinh ? new Date(studentData.NgaySinh).toISOString().split('T')[0] : '',
                // Đảm bảo ID ngoại lai là số
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
        // Validation cơ bản phía frontend
        // Backend đã có validation chặt chẽ hơn, nhưng frontend nên có cái này để user trải nghiệm tốt hơn
        let valid = true;
        let formError = '';

        if (!formData.NgaySinh) { formError = 'Ngày sinh không được để trống.'; valid = false; }
        if (!formData.IDNienKhoaTiepNhan) { formError = 'Niên khóa tiếp nhận không được để trống.'; valid = false; }
        if (!formData.GioiTinh) { formError = 'Giới tính không được để trống.'; valid = false; }

        // Kiểm tra định dạng Email (nếu có)
        if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
            formError = 'Địa chỉ Email không hợp lệ.'; valid = false;
        }

        // Kiểm tra tuổi với quy định mới nhất (chỉ khi tạo mới hoặc niên khóa thay đổi)
        if (valid && formData.NgaySinh && latestQuyDinh && formData.IDNienKhoaTiepNhan) {
            const nienKhoaTen = nienKhoas.find(nk => nk.id === Number(formData.IDNienKhoaTiepNhan))?.TenNienKhoa;
            if (nienKhoaTen) {
                 const nien_khoa_start_year = parseInt(nienKhoaTen.split('-')[0]);
                 const dob = new Date(formData.NgaySinh);
                 const age = nien_khoa_start_year - dob.getFullYear();
                 const monthDiff = dob.getMonth() - 8; // So sánh với tháng 9 (index 8)
                 
                 let calculatedAge = age;
                 // Nếu sinh sau tháng 9 của năm tiếp nhận, tuổi sẽ ít hơn 1 (giả sử tuổi tính vào 1/9)
                 if (monthDiff > 0 || (monthDiff === 0 && dob.getDate() > 1)) {
                     calculatedAge -= 1;
                 }
                
                if (calculatedAge < latestQuyDinh.TuoiToiThieu || calculatedAge > latestQuyDinh.TuoiToiDa) {
                    formError = `Tuổi học sinh (${calculatedAge} tuổi) không nằm trong khoảng quy định (${latestQuyDinh.TuoiToiThieu}-${latestQuyDinh.TuoiToiDa}).`;
                    valid = false;
                }
            }
        }
        
        setError(formError);
        return valid;
    };


    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Chuyển đổi ID Niên khóa và Khối thành số
            const dataToSend = {
                ...formData,
                IDNienKhoaTiepNhan: Number(formData.IDNienKhoaTiepNhan),
                KhoiDuKien: formData.KhoiDuKien ? Number(formData.KhoiDuKien) : null,
            };

            const result = await onSubmit(dataToSend, studentData?.id);
            setLoading(false);
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setLoading(false);
            setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
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
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3"><Form.Label>Họ *</Form.Label><Form.Control type="text" name="Ho" value={formData.Ho || ''} onChange={handleInputChange} required /></Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3"><Form.Label>Tên *</Form.Label><Form.Control type="text" name="Ten" value={formData.Ten || ''} onChange={handleInputChange} required /></Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ngày sinh *</Form.Label>
                                <Form.Control type="date" name="NgaySinh" value={formData.NgaySinh || ''} onChange={handleInputChange} required max={new Date().toISOString().split('T')[0]} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Giới tính *</Form.Label>
                                <Form.Select name="GioiTinh" value={formData.GioiTinh || 'Nam'} onChange={handleInputChange} required>
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
                                <Form.Control type="email" name="Email" value={formData.Email || ''} onChange={handleInputChange} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Địa chỉ *</Form.Label>
                                <Form.Control as="textarea" rows={1} name="DiaChi" value={formData.DiaChi || ''} onChange={handleInputChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Niên khóa tiếp nhận *</Form.Label>
                                <Form.Select name="IDNienKhoaTiepNhan" value={formData.IDNienKhoaTiepNhan || ''} onChange={handleInputChange} required>
                                    <option value="">Chọn niên khóa</option>
                                    {nienKhoas.map(nk => (
                                        <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Khối dự kiến</Form.Label>
                                <Form.Select name="KhoiDuKien" value={formData.KhoiDuKien || ''} onChange={handleInputChange}>
                                    <option value="">Không chọn</option>
                                    {khois.map(khoi => (
                                        <option key={khoi.id} value={khoi.id}>{khoi.TenKhoi}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
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