import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Table, Form, Button, Spinner, Modal
} from "react-bootstrap";
import { FaEdit, FaTrashAlt, FaEye } from "react-icons/fa";
import api from "../../api";

const QuanLyMonHoc = () => {
  const [dsMonHoc, setDsMonHoc] = useState([]);
  const [dsNienKhoa, setDsNienKhoa] = useState([]);
  const [dsToHop, setDsToHop] = useState([]);
  const [filterNienKhoa, setFilterNienKhoa] = useState("");
  const [filterToHop, setFilterToHop] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ TenMonHoc: "", IDNienKhoa: "", IDToHop: "" });

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
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchMonHoc = async () => {
      try {
        setLoading(true);
        let url = "/api/subjects/monhoc/";
        const params = [];
        if (filterNienKhoa) params.push(`nienkhoa=${filterNienKhoa}`);
        if (filterToHop) params.push(`tohop=${filterToHop}`);
        if (params.length > 0) url += `?${params.join("&")}`;
        const res = await api.get(url);
        setDsMonHoc(res.data);
      } catch (error) {
        console.error("Lỗi tải môn học:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMonHoc();
  }, [filterNienKhoa, filterToHop, showModal]);

  const handleView = (mh) => {
    alert(`Tên môn: ${mh.TenMonHoc}\nNiên khóa: ${mh.TenNienKhoa}\nTổ hợp: ${mh.TenToHop || "Không có"}`);
  };

  const handleEdit = (mh) => {
    setEditingId(mh.id);
    setForm({
      TenMonHoc: mh.TenMonHoc,
      IDNienKhoa: mh.IDNienKhoa,
      IDToHop: mh.IDToHop || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa không?")) {
      try {
        await api.delete(`/api/subjects/monhoc/${id}/`);
        setDsMonHoc(dsMonHoc.filter(m => m.id !== id));
      } catch (error) {
        alert("Lỗi khi xóa!");
      }
    }
  };

  const handleSave = async () => {
  // Kiểm tra dữ liệu trước khi gửi
  if (!form.TenMonHoc.trim()) {
    alert("Vui lòng nhập tên môn học.");
    return;
  }

  if (!form.IDNienKhoa) {
    alert("Vui lòng chọn niên khóa.");
    return;
  }

  try {
    const payload = {
      TenMonHoc: form.TenMonHoc.trim(),
      IDNienKhoa: parseInt(form.IDNienKhoa),
      IDToHop: form.IDToHop ? parseInt(form.IDToHop) : null,
    };

    if (editingId) {
      await api.put(`/api/subjects/monhoc/${editingId}/`, payload);
    } else {
      await api.post("/api/subjects/monhoc/", payload);
    }

    setShowModal(false);
    setForm({ TenMonHoc: "", IDNienKhoa: "", IDToHop: "" });
    setEditingId(null);
  } catch (error) {
    console.error("Lỗi chi tiết:", error.response?.data || error.message);
    alert("Lỗi khi lưu môn học!");
  }
};

  return (
    <Container className="py-4">
      <h3 className="fw-bold mb-3">Quản lý Môn học</h3>

      {/* Bộ lọc */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Select
            value={filterNienKhoa}
            onChange={(e) => setFilterNienKhoa(e.target.value)}
          >
            <option value="">Lọc theo niên khóa</option>
            {dsNienKhoa.map((nk) => (
              <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterToHop}
            onChange={(e) => setFilterToHop(e.target.value)}
          >
            <option value="">Lọc theo tổ hợp</option>
            {dsToHop.map((th) => (
              <option key={th.id} value={th.id}>{th.TenToHop}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md="auto" className="ms-auto">
          <Button variant="primary" onClick={() => { setShowModal(true); setEditingId(null); setForm({ TenMonHoc: "", IDNienKhoa: "", IDToHop: "" }); }}>
            + Thêm mới
          </Button>
        </Col>
      </Row>

      {/* Danh sách */}
      {loading ? (
        <Spinner animation="border" variant="primary" />
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên môn học</th>
              <th>Niên khóa</th>
              <th>Tổ hợp</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {dsMonHoc.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted">Không có dữ liệu</td>
              </tr>
            ) : (
              dsMonHoc.map((mh, index) => (
                <tr key={mh.id}>
                  <td>{index + 1}</td>
                  <td>{mh.TenMonHoc}</td>
                  <td>{mh.TenNienKhoa}</td>
                  <td>{mh.TenToHop || "Không có"}</td>
                  <td>
                    <Button variant="success" size="sm" className="me-2" onClick={() => handleView(mh)}>
                      <FaEye />
                    </Button>
                    <Button variant="info" size="sm" className="me-2" onClick={() => handleEdit(mh)}>
                      <FaEdit />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(mh.id)}>
                      <FaTrashAlt />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {/* Modal thêm / sửa */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? "Chỉnh sửa Môn học" : "Thêm môn học"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tên môn học</Form.Label>
            <Form.Control
              type="text"
              value={form.TenMonHoc}
              onChange={(e) => setForm({ ...form, TenMonHoc: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Niên khóa</Form.Label>
            <Form.Select
              value={form.IDNienKhoa}
              onChange={(e) => setForm({ ...form, IDNienKhoa: e.target.value })}
            >
              <option value="">-- Chọn --</option>
              {dsNienKhoa.map(nk => (
                <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tổ hợp</Form.Label>
            <Form.Select
              value={form.IDToHop}
              onChange={(e) => setForm({ ...form, IDToHop: e.target.value })}
            >
              <option value="">-- Không có --</option>
              {dsToHop.map(th => (
                <option key={th.id} value={th.id}>{th.TenToHop}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editingId ? "Cập nhật" : "Thêm"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuanLyMonHoc;
