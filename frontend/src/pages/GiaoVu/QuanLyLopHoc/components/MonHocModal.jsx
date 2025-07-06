import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import api from '../../../../api';

const MonHocModal = ({ show, onHide, onSubmit, lopHocData }) => {
  const [allMonHocs, setAllMonHocs] = useState([]);
  const [selectedMonHocIds, setSelectedMonHocIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (show && lopHocData) {
      const fetchMonHocs = async () => {
        setIsSubmitting(true); // Dùng isSubmitting để hiển thị spinner
        setApiError('');
        try {
          // Lấy các môn học thuộc niên khóa của lớp
          const res = await api.get(`/api/subjects/monhoc/?IDNienKhoa=${lopHocData.IDNienKhoa}`);
          setAllMonHocs(res.data.results || res.data);
          // Set các môn học đã được chọn ban đầu
          const initialSelectedIds = new Set(lopHocData.MonHoc.map(mh => mh.id));
          setSelectedMonHocIds(initialSelectedIds);
        } catch (err) {
          setApiError('Không thể tải danh sách môn học.');
        } finally {
          setIsSubmitting(false);
        }
      };
      fetchMonHocs();
    }
  }, [show, lopHocData]);

  const handleToggleMonHoc = (monHocId) => {
    setSelectedMonHocIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monHocId)) {
        newSet.delete(monHocId);
      } else {
        newSet.add(monHocId);
      }
      return newSet;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError('');
    // Gọi hàm onSubmit từ component cha
    const result = await onSubmit(lopHocData.id, { monhoc_ids: Array.from(selectedMonHocIds) });
    setIsSubmitting(false);
    // Nếu thất bại, hiển thị lỗi
    if (!result.success) {
      setApiError(result.error);
    }
  };

  return (
    <Modal show={show} onHide={() => !isSubmitting && onHide()} size="md" backdrop="static" centered>
      <Form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Quản lý môn học: <strong>{lopHocData?.TenLop}</strong></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {apiError && <Alert variant="danger">{apiError}</Alert>}
          {isSubmitting && !allMonHocs.length ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {allMonHocs.length > 0 ? allMonHocs.map(mh => (
                <ListGroup.Item key={mh.id} as="label" style={{ cursor: 'pointer' }}>
                  <Form.Check
                    type="checkbox"
                    id={`monhoc-${mh.id}`}
                    label={mh.TenMonHoc}
                    checked={selectedMonHocIds.has(mh.id)}
                    onChange={() => handleToggleMonHoc(mh.id)}
                  />
                </ListGroup.Item>
              )) : (
                <div className="text-center text-muted p-3">Không có môn học nào trong niên khóa này.</div>
              )}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>Hủy</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner as="span" size="sm" className="me-2" />}
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MonHocModal;