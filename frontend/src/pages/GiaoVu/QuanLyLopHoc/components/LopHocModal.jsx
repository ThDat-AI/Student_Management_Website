// src/pages/GiaoVu/QuanLyLopHoc/components/LopHocModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../../../../api';

const LopHocModal = ({ show, onHide, onSubmit, lopHocData, modalMode }) => {
  const isEditMode = modalMode === 'edit';
  const [formData, setFormData] = useState({});
  const [dropdowns, setDropdowns] = useState({ nienKhoas: [], khois: [], toHops: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [nkRes, kRes, thRes] = await Promise.all([
          api.get('/api/configurations/nienkhoa-list/'),
          api.get('/api/classes/khoi/'),
          api.get('/api/subjects/tohop/')
        ]);
        setDropdowns({ nienKhoas: nkRes.data, khois: kRes.data, toHops: thRes.data });
      } catch (err) {
        setError('Không thể tải dữ liệu cho các lựa chọn.');
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (isEditMode && lopHocData) {
      setFormData({
        TenLop: lopHocData.TenLop,
        IDNienKhoa: lopHocData.IDNienKhoa,
        IDKhoi: lopHocData.IDKhoi,
        IDToHop: lopHocData.IDToHop
      });
    } else {
      setFormData({ TenLop: '', IDNienKhoa: '', IDKhoi: '', IDToHop: '' });
    }
    setError('');
  }, [show, modalMode, lopHocData]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await onSubmit(formData, lopHocData?.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Tên lớp *</Form.Label>
            <Form.Control type="text" name="TenLop" value={formData.TenLop || ''} onChange={handleInputChange} required />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Niên khóa *</Form.Label>
                <Form.Select name="IDNienKhoa" value={formData.IDNienKhoa || ''} onChange={handleInputChange} required>
                  <option value="">Chọn niên khóa</option>
                  {dropdowns.nienKhoas.map(nk => <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Khối *</Form.Label>
                <Form.Select name="IDKhoi" value={formData.IDKhoi || ''} onChange={handleInputChange} required>
                  <option value="">Chọn khối</option>
                  {dropdowns.khois.map(k => <option key={k.id} value={k.id}>{k.TenKhoi}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Tổ hợp</Form.Label>
            <Form.Select name="IDToHop" value={formData.IDToHop || ''} onChange={handleInputChange}>
              <option value="">Chọn tổ hợp (nếu có)</option>
              {dropdowns.toHops.map(th => <option key={th.id} value={th.id}>{th.TenToHop}</option>)}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>Hủy</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading && <Spinner as="span" size="sm" className="me-2" />}
            {isEditMode ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LopHocModal;