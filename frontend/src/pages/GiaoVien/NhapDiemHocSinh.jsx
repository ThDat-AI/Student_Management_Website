import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Form, Button, Table, Spinner, Alert
} from "react-bootstrap";
import { FaClipboardList } from "react-icons/fa";
import { useLayout } from "../../contexts/LayoutContext";
import api from "../../api";
import '../../assets/styles/GiaoVienDashboard.css'; // dùng lại style

const NhapDiemHocSinh = () => {
  const [filters, setFilters] = useState({ nienKhoa: "", lopHoc: "", monHoc: "", hocKy: "" });
  const [dropdowns, setDropdowns] = useState({ nienKhoaList: [], lopHocList: [], monHocList: [], hocKyList: [] });
  const [hocSinhData, setHocSinhData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [diemDatMon, setDiemDatMon] = useState(5.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setPageTitle } = useLayout();

  const fieldLabels = {
    nienKhoa: "niên khóa",
    lopHoc: "lớp học",
    monHoc: "môn học",
    hocKy: "học kỳ"
  };

  useEffect(() => {
    setPageTitle("Nhập điểm học sinh");
    fetchDropdowns();
    fetchDiemDatMon();
  }, []);

  useEffect(() => {
    if (filters.nienKhoa) {
      fetchLopHoc(filters.nienKhoa);
      setFilters(prev => ({ ...prev, lopHoc: "" }));
    }
  }, [filters.nienKhoa]);

  useEffect(() => {
    const { nienKhoa, lopHoc, monHoc, hocKy } = filters;
    if (nienKhoa && lopHoc && monHoc && hocKy) fetchBangDiem();
  }, [filters]);

  const fetchDropdowns = async () => {
    try {
      const [nk, hk, mh] = await Promise.all([
        api.get("/api/students/filters/nienkhoa/"),
        api.get("/api/grading/hocky-list/"),
        api.get("/api/subjects/monhoc-list/")
      ]);
      setDropdowns(prev => ({
        ...prev,
        nienKhoaList: nk.data,
        hocKyList: hk.data,
        monHocList: mh.data
      }));
    } catch (err) {
      setError("Lỗi khi tải dropdown: " + err.message);
    }
  };

  const fetchLopHoc = async (nienKhoaId) => {
    try {
      const res = await api.get(`/api/classes/lophoc-list/?nienkhoa_id=${nienKhoaId}`);
      setDropdowns(prev => ({ ...prev, lopHocList: res.data }));
    } catch (err) {
      setError("Lỗi khi tải lớp học: " + err.message);
    }
  };

  const fetchDiemDatMon = async () => {
    try {
      const res = await api.get("/api/configurations/quydinh/latest/");
      setDiemDatMon(res.data?.DiemDatMon || 5.0);
    } catch {
      console.warn("Không thể tải điểm đạt môn. Dùng mặc định 5.0");
    }
  };

  const fetchBangDiem = async () => {
    const { nienKhoa, lopHoc, monHoc, hocKy } = filters;
    try {
      setLoading(true);
      const res = await api.get("/api/grading/diemso/", {
        params: { IDNienKhoa: nienKhoa, IDLopHoc: lopHoc, IDMonHoc: monHoc, IDHocKy: hocKy }
      });
      setHocSinhData(res.data);
    } catch (err) {
      setError("Lỗi khi tải bảng điểm: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDiem = (index, field, value) => {
    const updated = [...hocSinhData];
    updated[index][field] = value;
    setHocSinhData(updated);
  };

  const handleLuuDiem = async () => {
    try {
      setLoading(true);
      for (const hs of hocSinhData) {
        await api.post("/api/grading/diemso/cap-nhat/", {
          IDHocSinh: hs.id,
          IDLopHoc: filters.lopHoc,
          IDMonHoc: filters.monHoc,
          IDHocKy: filters.hocKy,
          Diem15: hs.Diem15 === "" ? null : parseFloat(hs.Diem15),
          Diem1Tiet: hs.Diem1Tiet === "" ? null : parseFloat(hs.Diem1Tiet)
        });
      }
      setIsEditing(false);
      fetchBangDiem();
    } catch (err) {
      setError("Lỗi khi lưu điểm: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const tinhDiemTB = (d15, d1t) => {
    const d1 = parseFloat(d15);
    const d2 = parseFloat(d1t);
    if (isNaN(d1) || isNaN(d2)) return "";
    return ((d1 + 2 * d2) / 3).toFixed(2);
  };

  const exportBangDiem = async (type) => {
    const { nienKhoa, lopHoc, monHoc, hocKy } = filters;
    const endpoint = type === "excel" ? "/api/grading/diemso/xuat-excel/" : "/api/grading/diemso/xuat-pdf/";

    try {
      const res = await api.get(endpoint, {
        params: { IDNienKhoa: nienKhoa, IDLopHoc: lopHoc, IDMonHoc: monHoc, IDHocKy: hocKy },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bang_diem.${type === "excel" ? "xlsx" : "pdf"}`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      setError("Lỗi khi xuất file: " + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <Container fluid className="px-4 py-4">
        {/* Banner giống dashboard */}
        <div className="welcome-banner p-4 rounded-4 position-relative overflow-hidden mb-4">
          <div className="banner-bg-animation">
            <div className="floating-orb orb-1"></div>
            <div className="floating-orb orb-2"></div>
            <div className="floating-orb orb-3"></div>
            <div className="floating-orb orb-4"></div>
            <div className="floating-orb orb-5"></div>
          </div>
          <div className="grid-pattern"></div>
          <div className="wave-animation">
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
            <div className="wave wave-3"></div>
          </div>
          <div className="particles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`}></div>
            ))}
          </div>
          <div className="shimmer-effect"></div>
          <div className="welcome-content d-flex align-items-center">
            <div className="banner-avatar-section me-4">
              <div className="avatar-container">
                <div className="avatar-main">
                  <div className="avatar-placeholder">
                    <FaClipboardList size={32} className="text-white avatar-icon" />
                  </div>
                </div>
                <div className="avatar-ring ring-1"></div>
                <div className="avatar-ring ring-2"></div>
                <div className="avatar-pulse pulse-1"></div>
                <div className="avatar-pulse pulse-2"></div>
                <div className="avatar-glow"></div>
              </div>
            </div>
            <div>
              <h2 className="text-white mb-1 fw-bold banner-title">Nhập điểm học sinh</h2>
              <p className="text-white-75 mb-0 banner-subtitle">Chỉnh sửa và quản lý điểm số của học sinh</p>
            </div>
          </div>
        </div>

        {/* Bộ lọc và bảng điểm */}
        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="mb-3">
          {["nienKhoa", "lopHoc", "monHoc", "hocKy"].map((field) => (
            <Col key={field}>
              <Form.Select
                value={filters[field]}
                onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}
              >
                <option value="">Chọn {fieldLabels[field]}</option>
                {dropdowns[`${field}List`]?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {field === "nienKhoa" && item.TenNienKhoa}
                    {field === "lopHoc" && item.TenLop}
                    {field === "monHoc" && item.TenMonHoc}
                    {field === "hocKy" && item.TenHocKy}
                  </option>
                ))}
              </Form.Select>
            </Col>
          ))}
        </Row>

        {loading ? (
          <Spinner animation="border" />
        ) : hocSinhData.length > 0 ? (
          <>
            <Table bordered hover responsive>
              <thead>
                <tr>
                  <th>Học sinh</th>
                  <th>Điểm 15 phút</th>
                  <th>Điểm 1 tiết</th>
                  <th>Điểm TB</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {hocSinhData.map((hs, index) => {
                  const diemTB = tinhDiemTB(hs.Diem15, hs.Diem1Tiet);
                  const ketQua = diemTB === "" ? "" : parseFloat(diemTB) >= diemDatMon ? "Đạt" : "Không đạt";
                  return (
                    <tr key={hs.id}>
                      <td>{hs.HoTen}</td>
                      <td>
                        {isEditing ? (
                          <Form.Control
                            type="number"
                            step="0.1"
                            value={hs.Diem15 || ""}
                            onChange={(e) => handleChangeDiem(index, "Diem15", e.target.value)}
                          />
                        ) : hs.Diem15 ?? ""}
                      </td>
                      <td>
                        {isEditing ? (
                          <Form.Control
                            type="number"
                            step="0.1"
                            value={hs.Diem1Tiet || ""}
                            onChange={(e) => handleChangeDiem(index, "Diem1Tiet", e.target.value)}
                          />
                        ) : hs.Diem1Tiet ?? ""}
                      </td>
                      <td>{diemTB}</td>
                      <td>{ketQua}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <div className="d-flex gap-2 mt-3">
              {!isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(true)}>Sửa điểm</Button>
                  <Button variant="success" onClick={() => exportBangDiem("excel")}>Xuất Excel</Button>
                  <Button variant="danger" onClick={() => exportBangDiem("pdf")}>Xuất PDF</Button>
                </>
              ) : (
                <>
                  <Button variant="success" onClick={handleLuuDiem}>Lưu điểm</Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>Hủy</Button>
                </>
              )}
            </div>
          </>
        ) : (
          <p>Không có dữ liệu bảng điểm.</p>
        )}
      </Container>
    </div>
  );
};

export default NhapDiemHocSinh;
