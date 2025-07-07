import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, ListGroup, InputGroup, FormControl } from 'react-bootstrap';
import api from '../../../../api';
import { FaSearch } from 'react-icons/fa';

const MonHocModal = ({ show, onHide, onSubmit, lopHocData }) => {
  const [allMonHocs, setAllMonHocs] = useState([]);
  const [selectedMonHocIds, setSelectedMonHocIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false); // Thêm state loading riêng
  const [apiError, setApiError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Thêm state cho tìm kiếm

  useEffect(() => {
    if (show && lopHocData) {
      const fetchMonHocs = async () => {
        setLoading(true);
        setApiError('');
        try {
          // === SỬA LỖI URL VÀ THAM SỐ Ở ĐÂY ===
          const res = await api.get(`/api/subjects/monhoc-list/?nienkhoa_id=${lopHocData.IDNienKhoa}`);
          setAllMonHocs(res.data);
          const initialSelectedIds = new Set(lopHocData.MonHoc.map(mh => mh.id));
          setSelectedMonHocIds(initialSelectedIds);
        } catch (err) {
          setApiError('Không thể tải danh sách môn học.');
        } finally {
          setLoading(false);
        }
      };
      fetchMonHocs();
    } else {
      // Reset state khi modal đóng
      setSearchTerm('');
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
    const result = await onSubmit(lopHocData.id, { monhoc_ids: Array.from(selectedMonHocIds) });
    setIsSubmitting(false);
    if (!result.success) {
      setApiError(result.error);
    }
  };

  // Lọc danh sách môn học dựa trên searchTerm
  const filteredMonHocs = searchTerm
    ? allMonHocs.filter(mh => mh.TenMonHoc.toLowerCase().includes(searchTerm.toLowerCase()))
    : allMonHocs;

  return (
    <Modal show={show} onHide={() => !isSubmitting && onHide()} size="md" backdrop="static" centered>
      <Form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Quản lý môn học: <strong>{lopHocData?.TenLop}</strong></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {apiError && <Alert variant="danger">{apiError}</Alert>}
          
          {/* Thêm ô tìm kiếm */}
          <InputGroup className="mb-3">
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <FormControl 
              placeholder="Tìm kiếm môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredMonHocs.length > 0 ? filteredMonHocs.map(mh => (
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
                <div className="text-center text-muted p-3">
                  {searchTerm ? 'Không tìm thấy môn học nào.' : 'Không có môn học nào trong niên khóa này.'}
                </div>
              )}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>Hủy</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || loading}>
            {isSubmitting ? <Spinner as="span" size="sm" className="me-2" /> : ''}
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MonHocModal;