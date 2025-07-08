import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Form, Button, Table, Spinner, Alert, Card} from "react-bootstrap";
import { FaFileExcel } from "react-icons/fa";
import { useLayout } from "../../../contexts/LayoutContext";
import api from "../../../api/index";
import '../../../assets/styles/GiaoVienDashboard.css'; // Tái sử dụng style

const XemDiemSo = () => {
  const [filters, setFilters] = useState({ nienKhoa: "", lopHoc: "", monHoc: "", hocKy: "" });
  const [dropdowns, setDropdowns] = useState({ nienKhoaList: [], lopHocList: [], monHocList: [], hocKyList: [] });
  
  const [hocSinhData, setHocSinhData] = useState([]);
  const [diemDatMon, setDiemDatMon] = useState(5.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setPageTitle } = useLayout();

  useEffect(() => {
    document.title = "Tra cứu điểm số";
    setPageTitle("Tra cứu điểm học sinh");
    fetchDropdowns();
    fetchDiemDatMon();
  }, [setPageTitle]);

  useEffect(() => {
    if (filters.nienKhoa) {
      fetchLopHoc(filters.nienKhoa);
      setFilters(prev => ({ ...prev, lopHoc: "", monHoc: "" }));
    } else {
      setDropdowns(prev => ({ ...prev, lopHocList: [], monHocList: [] }));
    }
  }, [filters.nienKhoa]);

  useEffect(() => {
    if (filters.lopHoc) {
      fetchMonHocTheoLop(filters.lopHoc);
      setFilters(prev => ({ ...prev, monHoc: "" }));
    } else {
       setDropdowns(prev => ({ ...prev, monHocList: [] }));
    }
  }, [filters.lopHoc]);

  const fetchDropdowns = async () => {
    try {
      const [nk, hk] = await Promise.all([
        api.get("/api/students/filters/nienkhoa/"),
        api.get("/api/grading/hocky-list/")
      ]);
      setDropdowns(prev => ({
        ...prev,
        nienKhoaList: nk.data || [],
        hocKyList: hk.data || []
      }));
    } catch (err) {
      setError("Lỗi khi tải dữ liệu dropdown.");
    }
  };

  const fetchLopHoc = async (nienKhoaId) => {
    try {
      const res = await api.get(`/api/classes/lophoc-list/?nienkhoa_id=${nienKhoaId}`);
      setDropdowns(prev => ({ ...prev, lopHocList: res.data || [] }));
    } catch (err) {
      setError("Lỗi khi tải danh sách lớp học.");
    }
  };
  
  const fetchMonHocTheoLop = async (lopHocId) => {
    try {
      const res = await api.get(`/api/classes/monhoc-theo-lop/?lop_hoc_id=${lopHocId}`);
      setDropdowns(prev => ({ ...prev, monHocList: res.data || [] }));
    } catch (err) {
      setError("Lỗi khi tải môn học theo lớp.");
    }
  };

  const fetchDiemDatMon = async () => {
    try {
      const res = await api.get("/api/configurations/quydinh/latest/");
      setDiemDatMon(res.data?.DiemDatMon || 5.0);
    } catch (err) {
      console.warn("Không thể tải điểm đạt môn. Dùng mặc định 5.0");
    }
  };

  // SỬA ĐỔI: useEffect để tự động fetch dữ liệu
  useEffect(() => {
    const { nienKhoa, lopHoc, monHoc, hocKy } = filters;

    // Nếu có đủ 4 bộ lọc thì mới fetch
    if (nienKhoa && lopHoc && monHoc && hocKy) {
        const fetchBangDiem = async () => {
            setError("");
            setLoading(true);
            try {
                const res = await api.get("/api/grading/diemso/", {
                    params: { IDNienKhoa: nienKhoa, IDLopHoc: lopHoc, IDMonHoc: monHoc, IDHocKy: hocKy }
                });
                setHocSinhData(res.data || []);
                if (res.data.length === 0) {
                    setError("Không tìm thấy dữ liệu điểm cho lựa chọn này.");
                }
            } catch (err) {
                setError("Lỗi khi tải bảng điểm: " + (err.response?.data?.detail || err.message));
            } finally {
                setLoading(false);
            }
        };
        fetchBangDiem();
    } else {
        // Nếu chưa đủ bộ lọc, reset bảng
        setHocSinhData([]);
        setError(""); // Xóa lỗi cũ
    }
  }, [filters.nienKhoa, filters.lopHoc, filters.monHoc, filters.hocKy]);

  const tinhDiemTB = (d15, d1t) => {
    const d1 = parseFloat(d15);
    const d2 = parseFloat(d1t);
    if (isNaN(d1) || isNaN(d2)) return "";
    return ((d1 + 2 * d2) / 3).toFixed(2);
  };
  
  const handleExportExcel = async () => {
    const { nienKhoa, lopHoc, monHoc, hocKy } = filters;
    try {
      const res = await api.get("/api/grading/diemso/xuat-excel/", {
        params: { IDNienKhoa: nienKhoa, IDLopHoc: lopHoc, IDMonHoc: monHoc, IDHocKy: hocKy },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      const tenLop = dropdowns.lopHocList.find(l => l.id === parseInt(lopHoc))?.TenLop || 'Lop';
      const tenMon = dropdowns.monHocList.find(m => m.id === parseInt(monHoc))?.TenMonHoc || 'Mon';
      link.href = url;
      link.setAttribute("download", `BangDiem_${tenLop}_${tenMon}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Lỗi khi xuất Excel: " + (err.response?.data?.detail || "Không có dữ liệu để xuất"));
    }
  };

  return (
    <div className="dashboard-container">
      <Container fluid className="px-4 py-4">
        <div className="welcome-banner p-4 rounded-4 position-relative overflow-hidden mb-4">
            <div className="banner-bg-animation">
                {[...Array(5)].map((_, i) => <div key={i} className={`floating-orb orb-${i + 1}`}></div>)}
            </div>
            <div className="welcome-content d-flex align-items-center">
                <div className="banner-avatar-section me-4">
                <div className="avatar-container"><div className="avatar-main"><div className="avatar-placeholder"><FaFileExcel size={32} className="text-white avatar-icon"/></div></div></div>
                </div>
                <div>
                <h2 className="text-white mb-1 fw-bold banner-title">Tra cứu điểm số</h2>
                <p className="text-white-75 mb-0 banner-subtitle">Xem và xuất bảng điểm chi tiết của học sinh</p>
                </div>
            </div>
        </div>
        
        <Card>
            <Card.Header as="h5">Bộ lọc tra cứu</Card.Header>
            <Card.Body>
                <Row className="mb-3 g-3">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Chọn niên khóa</Form.Label>
                            <Form.Select value={filters.nienKhoa} onChange={(e) => setFilters(prev => ({...prev, nienKhoa: e.target.value}))}>
                                <option value="">-- Chọn niên khóa --</option>
                                {dropdowns.nienKhoaList.map(item => (
                                    <option key={item.id} value={item.id}>{item.TenNienKhoa}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Chọn lớp học</Form.Label>
                            <Form.Select value={filters.lopHoc} onChange={(e) => setFilters(prev => ({...prev, lopHoc: e.target.value}))} disabled={!filters.nienKhoa}>
                                <option value="">-- Chọn lớp học --</option>
                                {dropdowns.lopHocList.map(item => (
                                    <option key={item.id} value={item.id}>{item.TenLop}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Chọn môn học</Form.Label>
                            <Form.Select value={filters.monHoc} onChange={(e) => setFilters(prev => ({...prev, monHoc: e.target.value}))} disabled={!filters.lopHoc}>
                                <option value="">-- Chọn môn học --</option>
                                {dropdowns.monHocList.map(item => (
                                    <option key={item.id} value={item.id}>{item.TenMonHoc}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label className="fw-bold">Chọn học kỳ</Form.Label>
                            <Form.Select value={filters.hocKy} onChange={(e) => setFilters(prev => ({...prev, hocKy: e.target.value}))}>
                                <option value="">-- Chọn học kỳ --</option>
                                {dropdowns.hocKyList.map(item => (
                                    <option key={item.id} value={item.id}>{item.TenHocKy}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
                <div className="d-flex gap-2">
                    <Button variant="success" onClick={handleExportExcel} disabled={hocSinhData.length === 0 || loading}>
                        <FaFileExcel /> Xuất Excel
                    </Button>
                </div>
            </Card.Body>
        </Card>

        {loading ? (
          <div className="text-center my-4"><Spinner animation="border" /></div>
        ) : error ? (
            <Alert variant="danger" className="mt-4">{error}</Alert>
        ) : hocSinhData.length > 0 ? (
          <Card className="mt-4">
            <Card.Header as="h5">Kết quả</Card.Header>
            <Card.Body>
                <Table bordered hover responsive>
                  <thead className="table-light">
                    <tr>
                      <th>Họ tên</th>
                      <th>Điểm 15 phút</th>
                      <th>Điểm 1 tiết</th>
                      <th>Điểm TB</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hocSinhData.map((hs) => {
                      const diemTB = tinhDiemTB(hs.Diem15, hs.Diem1Tiet);
                      const ketQua = diemTB === "" ? "" : parseFloat(diemTB) >= diemDatMon ? "Đạt" : "Không đạt";
                      return (
                        <tr key={hs.id}>
                          <td>{hs.HoTen}</td>
                          <td>{hs.Diem15 ?? "-"}</td>
                          <td>{hs.Diem1Tiet ?? "-"}</td>
                          <td>{diemTB || "-"}</td>
                          <td className={ketQua === 'Đạt' ? 'text-success fw-bold' : (ketQua === 'Không đạt' ? 'text-danger fw-bold' : '')}>{ketQua || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
            </Card.Body>
          </Card>
        ) : (
          <Alert variant="info" className="mt-4">Vui lòng chọn đầy đủ bộ lọc để tự động xem điểm.</Alert>
        )}
      </Container>
    </div>
  );
};

export default XemDiemSo;