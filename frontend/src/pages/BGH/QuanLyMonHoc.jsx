// file: QuanLyMonHoc.js
import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Table, Form, Button, Spinner, Modal, InputGroup, FormControl, Alert, Card
} from "react-bootstrap";
import { FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";
import api from "../../api";
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import { useLayout } from "../../contexts/LayoutContext";
import confirmDelete from "../../components/ConfirmDelete";

const QuanLyMonHoc = () => {
  const { setPageTitle } = useLayout();
  const [dsMonHoc, setDsMonHoc] = useState([]);
  const [dsNienKhoa, setDsNienKhoa] = useState([]);
  const [dsToHop, setDsToHop] = useState([]);
  
  const [selectedNienKhoa, setSelectedNienKhoa] = useState("");
  const [currentNienKhoaId, setCurrentNienKhoaId] = useState(null); 
  const [isCurrentNienKhoaSelected, setIsCurrentNienKhoaSelected] = useState(false); 
  const [filterToHop, setFilterToHop] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ TenMonHoc: "", IDToHop: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    document.title = "Quản lý Môn học";
    setPageTitle("Quản lý Môn học");
    const fetchFilters = async () => {
      try {
        
        const [resNK, resTH] = await Promise.all([
          api.get("/api/subjects/nienkhoa/"),
          api.get("/api/subjects/tohop/")
        ]);
        
        
        setDsNienKhoa(resNK.data);
        const currentNK = resNK.data.find(nk => nk.is_current);
        if (currentNK) {
          setCurrentNienKhoaId(currentNK.id);
        }
        

        setDsToHop(resTH.data);
      } catch (error) {
        setError("Không thể tải dữ liệu cho các bộ lọc.");
        toast.error("Lỗi khi tải dữ liệu niên khóa/tổ hợp.");
      }
    };
    fetchFilters();
  }, [setPageTitle]);

  
  useEffect(() => {
    setIsCurrentNienKhoaSelected(
      !!selectedNienKhoa && !!currentNienKhoaId && parseInt(selectedNienKhoa) === currentNienKhoaId
    );
  }, [selectedNienKhoa, currentNienKhoaId]);


  const fetchMonHoc = useCallback(async () => {
    if (!selectedNienKhoa) {
      setDsMonHoc([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ nienkhoa_id: selectedNienKhoa });
      if (filterToHop) params.append('tohop_id', filterToHop);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      
      const res = await api.get(`/api/subjects/monhoc-list/?${params.toString()}`);
      setDsMonHoc(res.data);
    } catch (error) {
      setError("Đã xảy ra lỗi khi tải danh sách môn học.");
      toast.error("Lỗi khi tải danh sách môn học.");
    } finally {
      setLoading(false);
    }
  }, [selectedNienKhoa, filterToHop, debouncedSearchTerm]);

  useEffect(() => {
    fetchMonHoc();
  }, [fetchMonHoc]);

  const handleOpenModal = (mh = null) => {
    
    if (!isCurrentNienKhoaSelected) return;

    setFormError("");
    if (mh) {
      setEditingId(mh.id);
      setForm({ TenMonHoc: mh.TenMonHoc, IDToHop: mh.IDToHop || "" });
    } else {
      setEditingId(null);
      setForm({ TenMonHoc: "", IDToHop: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleDelete = async (mh) => {
    const isConfirmed = await confirmDelete(`Bạn có chắc chắn muốn xóa môn học "${mh.TenMonHoc}"?`);
    if (!isConfirmed) return;  
    
    try {
      await api.delete(`/api/subjects/monhoc/${mh.id}/`);
      toast.success("Xóa môn học thành công!");
      fetchMonHoc();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi khi xóa! Môn học có thể đã được sử dụng hoặc thuộc niên khóa cũ.");
    }
  };

  const handleSave = async () => {
    if (!form.TenMonHoc.trim()) {
      setFormError("Vui lòng nhập tên môn học.");
      return;
    }
    setFormError("");
    setIsSubmitting(true);
    
    try {
      const payload = {
        TenMonHoc: form.TenMonHoc.trim(),
        IDNienKhoa: parseInt(selectedNienKhoa),
        IDToHop: form.IDToHop ? parseInt(form.IDToHop) : null,
      };

      if (editingId) {
        await api.put(`/api/subjects/monhoc/${editingId}/`, payload);
        toast.success("Cập nhật môn học thành công!");
      } else {
        await api.post("/api/subjects/monhoc-list/", payload);
        toast.success("Thêm môn học thành công!");
      }
      handleCloseModal();
      fetchMonHoc();
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.detail) {
        setFormError(errorData.detail);
      } else if (errorData && typeof errorData === 'object') {
        const messages = Object.values(errorData).flat().join(' ');
        setFormError(messages || "Lỗi không xác định.");
      } else {
        setFormError("Lỗi kết nối hoặc quyền truy cập. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <h2 className="h4 mb-4">Quản lý Môn học</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label className="fw-bold">Chọn Niên khóa</Form.Label>
            <Form.Select value={selectedNienKhoa} onChange={(e) => setSelectedNienKhoa(e.target.value)}>
              <option value="">-- Vui lòng chọn niên khóa --</option>
              {dsNienKhoa.map((nk) => (
                <option key={nk.id} value={nk.id}>
                  {nk.TenNienKhoa} {nk.is_current && "(Hiện hành)"}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>
      
      {selectedNienKhoa ? (
        <Card className="shadow-sm">
          <Card.Header as="h5" className="d-flex justify-content-between align-items-center bg-white p-3">
            <span>Danh sách môn học</span>
            {/* <-- THAY ĐỔI ĐIỀU KIỆN HIỂN THỊ NÚT THÊM --> */}
            {isCurrentNienKhoaSelected && (
              <Button variant="primary" onClick={() => handleOpenModal()}>
                <FaPlus className="me-2" /> Thêm Môn học
              </Button>
            )}
          </Card.Header>
          <Card.Body>
            {/* <-- THÊM CẢNH BÁO CHO NIÊN KHÓA CŨ --> */}
            {!isCurrentNienKhoaSelected && (
              <Alert variant="warning">
                Đây là niên khóa cũ. Bạn chỉ có thể xem thông tin, không thể thêm/sửa/xóa môn học.
              </Alert>
            )}

            <Row className="mb-3 g-3">
              <Col md={6}>
                <Form.Group><Form.Label>Lọc theo tổ hợp</Form.Label><Form.Select value={filterToHop} onChange={(e) => setFilterToHop(e.target.value)}><option value="">Tất cả tổ hợp</option>{dsToHop.map((th) => (<option key={th.id} value={th.id}>{th.TenToHop}</option>))} </Form.Select></Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Tìm kiếm theo tên môn</Form.Label><InputGroup><FormControl placeholder="Nhập tên môn học..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><InputGroup.Text><FaSearch /></InputGroup.Text></InputGroup></Form.Group>
              </Col>
            </Row>

            {loading ? ( <div className="text-center py-5"><Spinner animation="border" /></div> ) : (
              <Table striped bordered hover responsive>
                <thead className="table-light">
                  <tr><th>#</th><th>Tên môn học</th><th>Tổ hợp</th><th className="text-center">Thao tác</th></tr>
                </thead>
                <tbody>
                  {dsMonHoc.length === 0 ? ( <tr><td colSpan="4" className="text-center p-4">Không có môn học nào.</td></tr> ) : (
                    dsMonHoc.map((mh, index) => (
                      <tr key={mh.id}>
                        <td className="text-center">{index + 1}</td>
                        <td>{mh.TenMonHoc}</td>
                        <td>{mh.TenToHop || <span className="text-muted">Chung</span>}</td>
                        <td className="text-center">
                          {/* <-- THAY ĐỔI ĐIỀU KIỆN VÔ HIỆU HÓA --> */}
                          <Button variant="outline-primary" size="sm" className="me-2" 
                            onClick={() => handleOpenModal(mh)} 
                            disabled={!isCurrentNienKhoaSelected || !mh.is_deletable} 
                            title={!isCurrentNienKhoaSelected ? "Không thể sửa môn học của niên khóa cũ" : (!mh.is_deletable ? "Môn học đã được sử dụng" : "Chỉnh sửa")}
                          >
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" 
                            onClick={() => handleDelete(mh)} 
                            disabled={!isCurrentNienKhoaSelected || !mh.is_deletable}
                            title={!isCurrentNienKhoaSelected ? "Không thể xóa môn học của niên khóa cũ" : (!mh.is_deletable ? "Môn học đã được sử dụng" : "Xóa")}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info" className="text-center">Vui lòng chọn một niên khóa để xem và quản lý môn học.</Alert>
      )}

      {/* Modal không thay đổi nhiều, vì logic đã được chặn từ các nút bên ngoài */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton><Modal.Title>{editingId ? "Chỉnh sửa Môn học" : "Thêm Môn học mới"}</Modal.Title></Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Form.Group className="mb-3"><Form.Label>Tên môn học <span className="text-danger">*</span></Form.Label><Form.Control type="text" placeholder="VD: Toán, Ngữ Văn..." value={form.TenMonHoc} onChange={(e) => setForm({ ...form, TenMonHoc: e.target.value })} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Tổ hợp</Form.Label><Form.Select value={form.IDToHop} onChange={(e) => setForm({ ...form, IDToHop: e.target.value })}><option value="">-- Chọn tổ hợp (nếu có) --</option>{dsToHop.map(th => (<option key={th.id} value={th.id}>{th.TenToHop}</option>))} </Form.Select></Form.Group>
          <Form.Group><Form.Label>Niên khóa</Form.Label><Form.Control type="text" value={dsNienKhoa.find(nk => String(nk.id) === selectedNienKhoa)?.TenNienKhoa || ""} disabled /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>Hủy</Button>
          <Button variant="primary" onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? <Spinner as="span" size="sm" /> : (editingId ? "Cập nhật" : "Lưu")}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuanLyMonHoc;