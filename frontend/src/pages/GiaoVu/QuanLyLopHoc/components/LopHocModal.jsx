import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';

const LopHocModal = ({ show, onHide, onSubmit, lopHocData, modalMode, dropdowns }) => {
  const isEditMode = modalMode === 'edit';
  const [formData, setFormData] = useState({ TenLop: '', IDNienKhoa: '', IDKhoi: '', IDToHop: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (show) {
      setApiError(''); // Reset lỗi khi mở modal
      if (isEditMode && lopHocData) {
        setFormData({ 
            TenLop: lopHocData.TenLop || '', 
            IDNienKhoa: lopHocData.IDNienKhoa || '', 
            IDKhoi: lopHocData.IDKhoi || '', 
            IDToHop: lopHocData.IDToHop || ''
        });
      } else {
        const currentNienKhoa = dropdowns.nienKhoas.find(nk => nk.is_current);
        setFormData({ 
            TenLop: '', 
            IDNienKhoa: currentNienKhoa?.id || '', 
            IDKhoi: '', 
            IDToHop: '' 
        });
      }
    }
  }, [show, modalMode, lopHocData, isEditMode, dropdowns.nienKhoas]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (apiError) setApiError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if(!formData.TenLop || !formData.IDNienKhoa || !formData.IDKhoi) {
        setApiError("Vui lòng điền đầy đủ Tên lớp, Niên khóa và Khối.");
        return;
    }
    setIsSubmitting(true);
    setApiError('');
    // Chuyển IDToHop rỗng thành null trước khi gửi
    const dataToSend = { ...formData, IDToHop: formData.IDToHop || null };
    await onSubmit(dataToSend, lopHocData?.id);
    setIsSubmitting(false); // Component cha sẽ đóng modal nếu thành công
  };

  return (
    <Modal show={show} onHide={() => !isSubmitting && onHide()} size="lg" backdrop="static" centered>
      <Form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton><Modal.Title>{isEditMode ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {apiError && <Alert variant="danger">{apiError}</Alert>}
          <Form.Group className="mb-3"><Form.Label>Tên lớp <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="TenLop" value={formData.TenLop || ''} onChange={handleInputChange} required placeholder="Ví dụ: 10A1"/></Form.Group>
          <Row>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Niên khóa <span className="text-danger">*</span></Form.Label><Form.Select name="IDNienKhoa" value={formData.IDNienKhoa || ''} onChange={handleInputChange} required disabled={isEditMode || modalMode === 'create'}><option value="">Chọn niên khóa</option>{dropdowns.nienKhoas.map(nk => <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}{nk.is_current ? ' (Hiện hành)' : ''}</option>)}</Form.Select>{isEditMode && <Form.Text className="text-muted">Không thể thay đổi niên khóa của lớp đã tạo.</Form.Text>}</Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Khối <span className="text-danger">*</span></Form.Label><Form.Select name="IDKhoi" value={formData.IDKhoi || ''} onChange={handleInputChange} required disabled={isEditMode}><option value="">Chọn khối</option>{dropdowns.khois.map(k => <option key={k.id} value={k.id}>{k.TenKhoi}</option>)}</Form.Select>{isEditMode && <Form.Text className="text-muted">Không thể thay đổi khối của lớp đã tạo.</Form.Text>}</Form.Group></Col>
          </Row>
          <Form.Group className="mb-3"><Form.Label>Tổ hợp</Form.Label><Form.Select name="IDToHop" value={formData.IDToHop || ''} onChange={handleInputChange}><option value="">Chọn tổ hợp (nếu có)</option>{dropdowns.toHops.map(th => <option key={th.id} value={th.id}>{th.TenToHop}</option>)}</Form.Select></Form.Group>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={onHide} disabled={isSubmitting}>Hủy</Button><Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting && <Spinner as="span" size="sm" className="me-2" />} {isEditMode ? 'Lưu thay đổi' : 'Tạo mới'}</Button></Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LopHocModal;