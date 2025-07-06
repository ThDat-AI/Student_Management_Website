// src/pages/GiaoVu/QuanLyLopHoc/components/MonHocModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import api from '../../../../api';

const MonHocModal = ({ show, onHide, onSubmit, lopHocData }) => {
  const [allMonHocs, setAllMonHocs] = useState([]);
  const [selectedMonHocIds, setSelectedMonHocIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && lopHocData) {
      const fetchMonHocs = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await api.get(`/api/subjects/monhoc-list/?nienkhoa_id=${lopHocData.IDNienKhoa}`);
          setAllMonHocs(res.data);
          const initialSelectedIds = new Set(lopHocData.MonHoc.map(mh => mh.id));
          setSelectedMonHocIds(initialSelectedIds);
        } catch (err) {
          setError('Không thể tải danh sách môn học.');
        } finally {
          setLoading(false);
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
    setLoading(true);
    setError('');
    const result = await onSubmit(lopHocData.id, { monhoc_ids: Array.from(selectedMonHocIds) });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="md" backdrop="static">
      <Form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Quản lý môn học cho lớp: {lopHocData?.TenLop}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {allMonHocs.map(mh => (
                <ListGroup.Item key={mh.id}>
                  <Form.Check
                    type="checkbox"
                    id={`monhoc-${mh.id}`}
                    label={mh.TenMonHoc}
                    checked={selectedMonHocIds.has(mh.id)}
                    onChange={() => handleToggleMonHoc(mh.id)}
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>Hủy</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading && <Spinner as="span" size="sm" className="me-2" />}
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MonHocModal;