import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Table, Form, Button, Spinner, Modal, InputGroup, FormControl, Alert
} from "react-bootstrap";
// SỬ DỤNG BỘ ICON FONT AWESOME ĐỂ ĐỒNG BỘ
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import api from "../../api";
import { useDebounce } from 'use-debounce';

const QuanLyMonHoc = () => {
  const [dsMonHoc, setDsMonHoc] = useState([]);
  const [dsNienKhoa, setDsNienKhoa] = useState([]);
  const [dsToHop, setDsToHop] = useState([]);
  
  const [selectedNienKhoa, setSelectedNienKhoa] = useState("");
  const [filterToHop, setFilterToHop] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ TenMonHoc: "", IDToHop: "" });
  const [formError, setFormError] = useState("");

  // Tải danh sách Niên khóa và Tổ hợp một lần
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [resNK, resTH] = await Promise.all([
          api.get("/api/subjects/nienkhoa/"),
          api.get("/api/subjects/tohop/")
        ]);
        setDsNienKhoa(resNK.data);
        setDsToHop(resTH.data);
      } catch (error) {
        console.error("Lỗi tải bộ lọc:", error);
        setError("Không thể tải dữ liệu cho các bộ lọc.");
      }
    };
    fetchFilters();
  }, []);

  // Hàm tải danh sách Môn học, được gọi lại khi bộ lọc thay đổi
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

      const res = await api.get(`/api/subjects/monhoc/?${params.toString()}`);
      setDsMonHoc(res.data);
    } catch (error) {
      console.error("Lỗi tải môn học:", error);
      setError("Đã xảy ra lỗi khi tải danh sách môn học.");
    } finally {
      setLoading(false);
    }
  }, [selectedNienKhoa, filterToHop, debouncedSearchTerm]);

  useEffect(() => {
    fetchMonHoc();
  }, [fetchMonHoc]);

  // Mở Modal để thêm hoặc sửa
  const handleOpenModal = (mh = null) => {
    setFormError("");
    if (mh) {
      setEditingId(mh.id);
      setForm({ TenMonHoc: mh.TenMonHoc, IDToHop: mh.IDToHop });
    } else {
      setEditingId(null);
      setForm({ TenMonHoc: "", IDToHop: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // Xử lý xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) {
      try {
        await api.delete(`/api/subjects/monhoc/${id}/`);
        fetchMonHoc(); // Tải lại danh sách sau khi xóa
      } catch (error) {
        alert(error.response?.data?.detail || "Lỗi khi xóa! Môn học có thể đã được sử dụng.");
      }
    }
  };

  // Xử lý lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async () => {
    // Validation phía client
    if (!form.TenMonHoc.trim()) {
      setFormError("Vui lòng nhập tên môn học.");
      return;
    }
    if (!form.IDToHop) {
      setFormError("Vui lòng chọn tổ hợp cho môn học.");
      return;
    }
    setFormError("");
    
    try {
      const payload = {
        TenMonHoc: form.TenMonHoc.trim(),
        IDNienKhoa: parseInt(selectedNienKhoa),
        IDToHop: parseInt(form.IDToHop),
      };

      if (editingId) {
        await api.put(`/api/subjects/monhoc/${editingId}/`, payload);
      } else {
        await api.post("/api/subjects/monhoc/", payload);
      }
      handleCloseModal();
      fetchMonHoc(); // Tải lại danh sách sau khi lưu
    } catch (error) {
      // Xử lý lỗi từ server
      const errorData = error.response?.data;
      if (errorData) {
        if (errorData.TenMonHoc) setFormError(errorData.TenMonHoc[0]);
        else if (errorData.IDToHop) setFormError("Tổ hợp là bắt buộc.");
        else if (errorData.non_field_errors) setFormError(errorData.non_field_errors[0]);
        else if (errorData.detail) setFormError(errorData.detail);
        else setFormError("Lỗi không xác định. Vui lòng thử lại.");
      } else {
        setFormError("Lỗi kết nối. Vui lòng thử lại.");
      }
    }
  };

  return (
    <Container className="py-4">
      <h3 className="fw-bold mb-3">Quản lý Môn học</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label className="fw-bold">Chọn Niên khóa</Form.Label>
            <Form.Select value={selectedNienKhoa} onChange={(e) => setSelectedNienKhoa(e.target.value)}>
              <option value="">Chọn niên khóa</option>
              {dsNienKhoa.map((nk) => (<option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {selectedNienKhoa ? (
        <>
          <Row className="mb-3 g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Lọc theo tổ hợp</Form.Label>
                <Form.Select value={filterToHop} onChange={(e) => setFilterToHop(e.target.value)}>
                  <option value="">Tất cả tổ hợp</option>
                  {dsToHop.map((th) => (<option key={th.id} value={th.id}>{th.TenToHop}</option>))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Tìm kiếm theo tên môn</Form.Label>
                <InputGroup>
                  <FormControl placeholder="Nhập tên môn học..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <InputGroup.Text><FaSearch /></InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end justify-content-end">
              <Button variant="primary" onClick={() => handleOpenModal()}>
                + Thêm Môn học
              </Button>
            </Col>
          </Row>

          {loading ? ( <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> ) : (
            <Table striped bordered hover responsive className="shadow-sm">
              <thead className="table-primary">
                <tr>
                  <th className="text-center">#</th>
                  <th>Tên môn học</th>
                  <th>Tổ hợp</th>
                  <th className="text-center" style={{width: '120px'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {dsMonHoc.length === 0 ? ( <tr><td colSpan="4" className="text-center text-muted p-4">Không có dữ liệu</td></tr> ) : (
                  dsMonHoc.map((mh, index) => (
                    <tr key={mh.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{mh.TenMonHoc}</td>
                      <td>{mh.TenToHop}</td>
                      <td className="text-center">
                        {/* === PHẦN THAY ĐỔI THEO YÊU CẦU === */}
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(mh)} disabled={!mh.is_deletable} title={!mh.is_deletable ? "Không thể sửa vì đã có dữ liệu liên quan" : "Chỉnh sửa"}>
                          <FaEdit />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(mh.id)} disabled={!mh.is_deletable} title={!mh.is_deletable ? "Không thể xóa vì đã có dữ liệu liên quan" : "Xóa"}>
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </>
      ) : (
        <div className="text-center p-5 border rounded bg-light mt-4">
          <p className="text-muted fs-5">Vui lòng chọn một niên khóa để xem và quản lý môn học.</p>
        </div>
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Chỉnh sửa Môn học" : "Thêm Môn học mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Tên môn học <span className="text-danger">*</span></Form.Label>
            <Form.Control type="text" placeholder="VD: Toán, Ngữ Văn..." value={form.TenMonHoc} onChange={(e) => setForm({ ...form, TenMonHoc: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tổ hợp <span className="text-danger">*</span></Form.Label>
            <Form.Select value={form.IDToHop} onChange={(e) => setForm({ ...form, IDToHop: e.target.value })}>
              <option value="">-- Chọn tổ hợp --</option>
              {dsToHop.map(th => (<option key={th.id} value={th.id}>{th.TenToHop}</option>))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Niên khóa</Form.Label>
            <Form.Control type="text" value={dsNienKhoa.find(nk => String(nk.id) === selectedNienKhoa)?.TenNienKhoa || ""} disabled />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Hủy</Button>
          <Button variant="primary" onClick={handleSave}>{editingId ? "Cập nhật" : "Lưu"}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuanLyMonHoc;