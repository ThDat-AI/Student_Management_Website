// pages/BGH/QuyDinhManagement.jsx
import { useState, useEffect, useCallback } from "react"
import { useLayout } from "../../contexts/LayoutContext"
import { Container, Row, Col, Button, Alert, Card, Spinner, Form, Modal, Badge, InputGroup } from "react-bootstrap"
import { FaPlus, FaEdit, FaTrashAlt, FaSearch, FaUsers, FaGraduationCap, FaClipboardList } from "react-icons/fa"
import api from "../../api"

import confirmDelete from "../../components/ConfirmDelete"
// --- COMPONENT MODAL (Tạo/Sửa quy định) ---
const QuyDinhModal = ({ show, onHide, mode, selectedQuyDinh, latestQuyDinh, onSubmit }) => {
  const isEditMode = mode === "edit"
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    setError("")
    setValidationErrors({})
    const defaults = latestQuyDinh || {
      TuoiToiThieu: 15,
      TuoiToiDa: 20,
      SiSoToiDa: 40,
      SoMonHocToiDa: 9,
      DiemDatMon: 5.0,
      SoLopK10: 4,
      SoLopK11: 3,
      SoLopK12: 2,
    }

    if (isEditMode && selectedQuyDinh) {
      setFormData({ ...selectedQuyDinh })
    } else {
      setFormData({ TenNienKhoa: "", ...defaults })
    }
  }, [show, mode, selectedQuyDinh, latestQuyDinh])

  const validateForm = () => {
    const errors = {}

    // Validate age range
    const minAge = Number.parseInt(formData.TuoiToiThieu)
    const maxAge = Number.parseInt(formData.TuoiToiDa)

    if (minAge >= maxAge) {
      errors.TuoiToiThieu = "Tuổi tối thiểu phải nhỏ hơn tuổi tối đa"
      errors.TuoiToiDa = "Tuổi tối đa phải lớn hơn tuổi tối thiểu"
    }

    if (minAge < 10 || minAge > 25) {
      errors.TuoiToiThieu = "Tuổi tối thiểu phải từ 10 đến 25"
    }

    if (maxAge < 15 || maxAge > 30) {
      errors.TuoiToiDa = "Tuổi tối đa phải từ 15 đến 30"
    }

    // Validate other fields
    if (formData.SiSoToiDa < 1 || formData.SiSoToiDa > 100) {
      errors.SiSoToiDa = "Sĩ số tối đa phải từ 1 đến 100"
    }

    if (formData.DiemDatMon < 0 || formData.DiemDatMon > 10) {
      errors.DiemDatMon = "Điểm đạt môn phải từ 0 đến 10"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setError("Vui lòng kiểm tra lại các thông tin đã nhập")
      return
    }

    setLoading(true)
    setError("")

    const result = await onSubmit(formData)
    setLoading(false)
    if (!result.success) {
      setError(result.error)
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditMode ? `Chỉnh sửa quy định: ${selectedQuyDinh?.TenNienKhoa}` : "Thêm niên khóa và quy định mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {!isEditMode && (
            <Form.Group className="mb-3 p-3 border rounded bg-light">
              <Form.Label className="fw-bold">Tên niên khóa mới *</Form.Label>
              <Form.Control
                type="text"
                name="TenNienKhoa"
                placeholder="Nhập tên niên khóa (VD: 2024-2025)"
                value={formData.TenNienKhoa || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          )}

          <p className="fw-bold mt-3">Thiết lập các tham số</p>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tuổi tối thiểu</Form.Label>
                <Form.Control
                  type="number"
                  name="TuoiToiThieu"
                  value={formData.TuoiToiThieu || ""}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.TuoiToiThieu}
                  required
                />
                <Form.Control.Feedback type="invalid">{validationErrors.TuoiToiThieu}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tuổi tối đa</Form.Label>
                <Form.Control
                  type="number"
                  name="TuoiToiDa"
                  value={formData.TuoiToiDa || ""}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.TuoiToiDa}
                  required
                />
                <Form.Control.Feedback type="invalid">{validationErrors.TuoiToiDa}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Sĩ số tối đa</Form.Label>
                <Form.Control
                  type="number"
                  name="SiSoToiDa"
                  value={formData.SiSoToiDa || ""}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.SiSoToiDa}
                  required
                />
                <Form.Control.Feedback type="invalid">{validationErrors.SiSoToiDa}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Số môn học tối đa</Form.Label>
                <Form.Control
                  type="number"
                  name="SoMonHocToiDa"
                  value={formData.SoMonHocToiDa || ""}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Điểm đạt môn</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  name="DiemDatMon"
                  value={formData.DiemDatMon || ""}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.DiemDatMon}
                  required
                />
                <Form.Control.Feedback type="invalid">{validationErrors.DiemDatMon}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Số lớp khối 10</Form.Label>
                <Form.Control
                  type="number"
                  name="SoLopK10"
                  value={formData.SoLopK10 || ""}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Số lớp khối 11</Form.Label>
                <Form.Control
                  type="number"
                  name="SoLopK11"
                  value={formData.SoLopK11 || ""}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Số lớp khối 12</Form.Label>
                <Form.Control
                  type="number"
                  name="SoLopK12"
                  value={formData.SoLopK12 || ""}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner as="span" size="sm" className="me-2" /> : null}
            {isEditMode ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

// --- COMPONENT TABLE HIỂN THỊ ---
const QuyDinhTable = ({ quyDinhs, onEdit, onDelete }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th className="text-nowrap">
              <FaGraduationCap className="me-2 text-primary" />
              Niên khóa
            </th>
            <th className="text-center text-nowrap">
              <FaUsers className="me-2 text-info" />
              Độ tuổi
            </th>
            <th className="text-center text-nowrap">
              <FaUsers className="me-2 text-success" />
              Sĩ số tối đa
            </th>
            <th className="text-center text-nowrap">
              <FaClipboardList className="me-2 text-warning" />
              Số môn tối đa
            </th>
            <th className="text-center text-nowrap">
              <FaGraduationCap className="me-2 text-danger" />
              Điểm đạt
            </th>
            <th className="text-center text-nowrap">Số lớp (10/11/12)</th>
            <th className="text-center text-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {quyDinhs.map((qd) => (
            <tr key={qd.IDNienKhoa} className="border-bottom">
              <td>
                <div className="d-flex align-items-center">
                  <div className="bg-primary rounded-circle p-2 me-3">
                    <FaGraduationCap className="text-white" size={14} />
                  </div>
                  <div>
                    <strong className="text-dark">{qd.TenNienKhoa}</strong>
                    <br />
                    <small className="text-muted">Niên khóa học</small>
                  </div>
                </div>
              </td>
              <td className="text-center">
                <Badge bg="info" className="px-3 py-2">
                  {qd.TuoiToiThieu} - {qd.TuoiToiDa} tuổi
                </Badge>
              </td>
              <td className="text-center">
                <div className="fw-bold text-success fs-5">{qd.SiSoToiDa}</div>
                <small className="text-muted">học sinh</small>
              </td>
              <td className="text-center">
                <div className="fw-bold text-warning fs-5">{qd.SoMonHocToiDa}</div>
                <small className="text-muted">môn học</small>
              </td>
              <td className="text-center">
                <Badge bg="primary" className="fs-6 px-3 py-2">
                  {qd.DiemDatMon}
                </Badge>
              </td>
              <td className="text-center">
                <div className="d-flex justify-content-center gap-2">
                  <Badge bg="outline-primary" text="primary" className="border">
                    K10: {qd.SoLopK10}
                  </Badge>
                  <Badge bg="outline-success" text="success" className="border">
                    K11: {qd.SoLopK11}
                  </Badge>
                  <Badge bg="outline-warning" text="warning" className="border">
                    K12: {qd.SoLopK12}
                  </Badge>
                </div>
              </td>
              <td className="text-center">
                <div className="btn-group" role="group">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onEdit(qd)}
                    title="Sửa quy định"
                    className="me-1"
                  >
                    <FaEdit />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => onDelete(qd)} title="Xóa quy định">
                    <FaTrashAlt />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- COMPONENT TRANG CHÍNH ---
const QuyDinhManagement = () => {
  const [quyDinhs, setQuyDinhs] = useState([])
  const [latestQuyDinh, setLatestQuyDinh] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("create")
  const [selectedQuyDinh, setSelectedQuyDinh] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { setPageTitle } = useLayout()

  useEffect(() => {
    setPageTitle("Quản lý quy định")
  }, [setPageTitle])

  const fetchData = useCallback(async (searchQuery) => {
    setLoading(true)
    setError("")
    try {
      const qdRes = await api.get("/api/configurations/quydinh/", {
        params: { search: searchQuery },
      })
      setQuyDinhs(qdRes.data)

      if (!searchQuery) {
        const latestQdRes = await api.get("/api/configurations/quydinh/latest/")
        setLatestQuyDinh(Object.keys(latestQdRes.data).length > 0 ? latestQdRes.data : null)
      }
    } catch (err) {
      setError("Không thể tải dữ liệu.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(searchTerm)
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [fetchData, searchTerm])

  const handleShowCreateModal = () => {
    setModalMode("create")
    setSelectedQuyDinh(null)
    setShowModal(true)
  }

  const handleShowEditModal = (quydinh) => {
    setModalMode("edit")
    setSelectedQuyDinh(quydinh)
    setShowModal(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (modalMode === "create") {
        await api.post("/api/configurations/quydinh/", formData)
        setSuccess("Thêm niên khóa và quy định mới thành công!")
      } else {
        await api.patch(`/api/configurations/quydinh/${selectedQuyDinh.IDNienKhoa}/`, formData)
        setSuccess("Cập nhật quy định thành công!")
      }
      setShowModal(false)
      fetchData(searchTerm)
      return { success: true }
    } catch (err) {
      let errorMsg = "Thao tác không thành công."

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMsg = err.response.data
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail
        } else {
          const errors = Object.values(err.response.data).flat()
          errorMsg = errors.join(" ")
        }
      }

      return { success: false, error: errorMsg }
    }
  }

  const handleDelete = async (quydinh) => {
    const isConfirmed = await confirmDelete(`Bạn có chắc muốn xóa niên khóa ${quydinh.TenNienKhoa} và quy định liên quan?`);
    if (!isConfirmed) return;
    {
      try {
        await api.delete(`/api/configurations/quydinh/${quydinh.IDNienKhoa}/`)
        setSuccess("Xóa thành công!")
        fetchData(searchTerm)
      } catch (err) {
        let errorMsg = "Xóa không thành công."

        if (err.response?.data) {
          if (typeof err.response.data === "string") {
            errorMsg = err.response.data
          } else if (err.response.data.detail) {
            errorMsg = err.response.data.detail
          } else {
            const errors = Object.values(err.response.data).flat()
            errorMsg = errors.join(" ")
          }
        }

        setError(errorMsg)
      }
    }
  }

  return (
    <Container fluid className="py-4">
      {/* Header Section */}
      <Row className="justify-content-between align-items-center mb-4">
        <Col xs={12} md="auto">
          <h2 className="h4 mb-2 mb-md-0">
            <FaClipboardList className="me-2 text-primary" />
            Các quy định theo niên khóa
          </h2>
        </Col>
        <Col xs={12} md={5} lg={4}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Tìm theo tên niên khóa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col xs="auto" className="mt-2 mt-md-0">
          <Button variant="primary" onClick={handleShowCreateModal}>
            <FaPlus className="me-2" />
            Thêm mới
          </Button>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
        </div>
      ) : quyDinhs.length > 0 ? (
        <Card className="shadow-sm">
          <Card.Header className="bg-white py-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaClipboardList className="me-2 text-primary" />
                Danh sách quy định ({quyDinhs.length})
              </h5>
              <small className="text-muted">{searchTerm && `Kết quả tìm kiếm cho "${searchTerm}"`}</small>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <QuyDinhTable quyDinhs={quyDinhs} onEdit={handleShowEditModal} onDelete={handleDelete} />
          </Card.Body>
        </Card>
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <FaClipboardList size={48} className="text-muted mb-3" />
            <h5 className="text-muted">
              {searchTerm
                ? `Không tìm thấy quy định cho niên khóa "${searchTerm}"`
                : "Chưa có quy định nào được thiết lập"}
            </h5>
            {!searchTerm && (
              <Button variant="primary" onClick={handleShowCreateModal} className="mt-3">
                <FaPlus className="me-2" />
                Thêm quy định đầu tiên
              </Button>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <QuyDinhModal
          show={showModal}
          onHide={() => setShowModal(false)}
          mode={modalMode}
          selectedQuyDinh={selectedQuyDinh}
          latestQuyDinh={latestQuyDinh}
          onSubmit={handleSubmit}
        />
      )}
    </Container>
  )
}

export default QuyDinhManagement
