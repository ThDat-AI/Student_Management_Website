import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Form, Button, Table, Spinner, Alert
} from "react-bootstrap";
import { FaFileExcel, FaChartLine } from "react-icons/fa";
import api from "../../api";
import "../../assets/styles/GiaoVuDashboard.css";

const BaoCaoTongKetHocKy = () => {
  const [filters, setFilters] = useState({ nienKhoa: "", hocKy: "" });
  const [dropdowns, setDropdowns] = useState({ nienKhoaList: [], hocKyList: [] });
  const [baoCaoData, setBaoCaoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDropdowns = async () => {
    try {
      const [nkRes, hkRes] = await Promise.all([
        api.get("/api/students/filters/nienkhoa/"),
        api.get("/api/grading/hocky-list/")
      ]);
      setDropdowns({
        nienKhoaList: nkRes.data,
        hocKyList: hkRes.data
      });
    } catch (err) {
      setError("Lỗi khi tải dropdown: " + err.message);
    }
  };

  const fetchBaoCao = async () => {
    const { nienKhoa, hocKy } = filters;
    if (nienKhoa && hocKy) {
      try {
        setLoading(true);
        const res = await api.get("/api/reporting/baocao/hocky/", {
          params: { IDNienKhoa: nienKhoa, IDHocKy: hocKy }
        });
        setBaoCaoData(res.data);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu báo cáo: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const exportExcel = async () => {
    const { nienKhoa, hocKy } = filters;
    if (!nienKhoa || !hocKy) return;

    try {
      const res = await api.get("/api/reporting/baocao/hocky/xuat-excel/", {
        params: { IDNienKhoa: nienKhoa, IDHocKy: hocKy },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bao_cao_hoc_ky.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      setError("Lỗi khi xuất Excel: " + err.message);
    }
  };

  useEffect(() => { fetchDropdowns(); }, []);
  useEffect(() => { fetchBaoCao(); }, [filters]);

  return (
    <div className="dashboard-container">
      <Container fluid className="px-4 py-4">
        {/* Banner động */}
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
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
            <div className="particle particle-5"></div>
            <div className="particle particle-6"></div>
          </div>
          <div className="shimmer-effect"></div>
          <div className="welcome-content d-flex align-items-center">
            <div className="banner-avatar-section me-4">
              <div className="avatar-container">
                <div className="avatar-main">
                  <div className="avatar-placeholder">
                    <FaChartLine size={32} className="text-white avatar-icon" />
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
              <h2 className="text-white mb-1 fw-bold banner-title">Báo cáo tổng kết học kỳ</h2>
              <p className="text-white-75 mb-0 banner-subtitle">Xem và xuất thống kê theo lớp, học kỳ, niên khóa</p>
            </div>
          </div>
        </div>

        {/* Lọc dữ liệu */}
        <Row className="mb-4">
          <Col md={6}>
            <Form.Select
              value={filters.nienKhoa}
              onChange={(e) => setFilters({ ...filters, nienKhoa: e.target.value })}
            >
              <option value="">Chọn niên khóa</option>
              {dropdowns.nienKhoaList.map((nk) => (
                <option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Select
              value={filters.hocKy}
              onChange={(e) => setFilters({ ...filters, hocKy: e.target.value })}
            >
              <option value="">Chọn học kỳ</option>
              {dropdowns.hocKyList.map((hk) => (
                <option key={hk.id} value={hk.id}>{hk.TenHocKy}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {/* Báo cáo & Xuất file */}
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <Spinner animation="border" />
        ) : baoCaoData.length > 0 ? (
          <>
            <Table bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>Lớp</th>
                  <th>Sĩ số</th>
                  <th>Số lượng đạt</th>
                  <th>Tỉ lệ (%)</th>
                </tr>
              </thead>
              <tbody>
                {baoCaoData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.TenLop}</td>
                    <td>{row.SiSo}</td>
                    <td>{row.SoLuongDat}</td>
                    <td>{row.TiLe.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="d-flex gap-3 mt-3">
              <Button variant="success" onClick={exportExcel}>
                <FaFileExcel className="me-2" /> Xuất Excel
              </Button>
            </div>
          </>
        ) : (
          <p>Không có dữ liệu để hiển thị.</p>
        )}
      </Container>
    </div>
  );
};

export default BaoCaoTongKetHocKy;
