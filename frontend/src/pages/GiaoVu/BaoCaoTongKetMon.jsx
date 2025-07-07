// src/pages/BGH/BaoCaoTongKetMon.jsx (hoặc đường dẫn tương ứng)

import React, { useEffect, useState } from "react";
import {
  Container, Row, Col, Form, Button, Table, Spinner, Alert, Card
} from "react-bootstrap";
import { FaChartBar, FaFileExcel } from "react-icons/fa";
import api from "../../api";
import "../../assets/styles/GiaoVuDashboard.css"; // Đảm bảo đường dẫn này đúng
import { toast } from 'react-toastify';

const BaoCaoTongKetMon = () => {
  // State cho bộ lọc
  const [filters, setFilters] = useState({
    nienKhoa: "",
    monHoc: "",
    hocKy: ""
  });

  // State cho các danh sách dropdown
  const [dropdowns, setDropdowns] = useState({
    nienKhoaList: [],
    monHocList: [], // Sẽ được tải sau
    hocKyList: []
  });

  const [baoCaoData, setBaoCaoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tải Niên khóa và Học kỳ khi component được mount
  useEffect(() => {
    document.title = "Báo cáo tổng kết môn học";
    const fetchInitialDropdowns = async () => {
      try {
        const [nkRes, hkRes] = await Promise.all([
          api.get("/api/students/filters/nienkhoa/"),
          api.get("/api/grading/hocky-list/")
        ]);
        setDropdowns(prev => ({
          ...prev,
          nienKhoaList: nkRes.data,
          hocKyList: hkRes.data
        }));
      } catch (err) {
        setError("Lỗi khi tải dropdown ban đầu: " + err.message);
      }
    };
    fetchInitialDropdowns();
  }, []);

  // Tải Môn học KHI người dùng chọn một Niên khóa
  useEffect(() => {
    if (filters.nienKhoa) {
      const fetchMonHoc = async () => {
        try {
          // Gọi API với nienkhoa_id
          const res = await api.get(`/api/subjects/monhoc-list/?nienkhoa_id=${filters.nienKhoa}`);
          setDropdowns(prev => ({ ...prev, monHocList: res.data }));
        } catch (err) {
          setError("Lỗi khi tải danh sách môn học: " + err.message);
          setDropdowns(prev => ({ ...prev, monHocList: [] }));
        }
      };
      fetchMonHoc();
    } else {
      setDropdowns(prev => ({ ...prev, monHocList: [] }));
    }
    // Reset lựa chọn môn học khi niên khóa thay đổi
    setFilters(prev => ({ ...prev, monHoc: "" }));
  }, [filters.nienKhoa]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Tải dữ liệu báo cáo khi cả 3 bộ lọc đã được chọn
  useEffect(() => {
    const { nienKhoa, monHoc, hocKy } = filters;
    if (nienKhoa && monHoc && hocKy) {
      const fetchBaoCao = async () => {
        try {
          setLoading(true);
          setError('');
          const res = await api.get("/api/reporting/baocao/monhoc/", {
            params: {
              IDNienKhoa: nienKhoa,
              IDMonHoc: monHoc,
              IDHocKy: hocKy,
            }
          });
          setBaoCaoData(res.data);
        } catch (err) {
          setError("Lỗi khi tải dữ liệu báo cáo: " + (err.response?.data?.detail || err.message));
        } finally {
          setLoading(false);
        }
      };
      fetchBaoCao();
    } else {
      setBaoCaoData([]); // Xóa dữ liệu cũ nếu chưa đủ bộ lọc
    }
  }, [filters]);


  const exportExcel = async () => {
    const { nienKhoa, monHoc, hocKy } = filters;
    if (!nienKhoa || !monHoc || !hocKy) {
      toast.warn("Vui lòng chọn đủ bộ lọc trước khi xuất file.");
      return;
    }
    try {
      const res = await api.get("/api/reporting/baocao/monhoc/xuat-excel/", {
        params: { IDNienKhoa: nienKhoa, IDMonHoc: monHoc, IDHocKy: hocKy },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bao_cao_mon_hoc.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Xuất file thành công!");
    } catch (err) {
      toast.error("Lỗi khi xuất Excel: " + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <Container fluid className="px-4 py-4">
        {/* Banner */}
        <div className="welcome-banner p-4 rounded-4 position-relative overflow-hidden mb-4">
            <div className="banner-avatar-section me-4">
              <div className="avatar-container"><div className="avatar-main"><div className="avatar-placeholder"><FaChartBar size={32} className="text-white avatar-icon" /></div></div></div>
            </div>
            <div>
              <h2 className="text-white mb-1 fw-bold banner-title">Báo cáo tổng kết môn học</h2>
              <p className="text-white-75 mb-0 banner-subtitle">Xem và xuất thống kê môn học theo học kỳ</p>
            </div>
        </div>

        {/* Nội dung chính */}
        <Card>
            <Card.Header as="h5">Bộ lọc báo cáo</Card.Header>
            <Card.Body>
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                <Row className="mb-3 g-3">
                    <Col md={4}>
                        <Form.Group><Form.Label>Niên khóa</Form.Label><Form.Select name="nienKhoa" value={filters.nienKhoa} onChange={handleFilterChange}><option value="">Chọn niên khóa</option>{dropdowns.nienKhoaList.map((nk) => (<option key={nk.id} value={nk.id}>{nk.TenNienKhoa}</option>))}</Form.Select></Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group><Form.Label>Môn học</Form.Label><Form.Select name="monHoc" value={filters.monHoc} onChange={handleFilterChange} disabled={!filters.nienKhoa}><option value="">Chọn môn học</option>{dropdowns.monHocList.map((mh) => (<option key={mh.id} value={mh.id}>{mh.TenMonHoc}</option>))}</Form.Select></Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group><Form.Label>Học kỳ</Form.Label><Form.Select name="hocKy" value={filters.hocKy} onChange={handleFilterChange}><option value="">Chọn học kỳ</option>{dropdowns.hocKyList.map((hk) => (<option key={hk.id} value={hk.id}>{hk.TenHocKy}</option>))}</Form.Select></Form.Group>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
        
        <Card className="mt-4">
            <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                Kết quả báo cáo
                <Button variant="success" onClick={exportExcel} disabled={baoCaoData.length === 0}>
                    <FaFileExcel className="me-2" /> Xuất Excel
                </Button>
            </Card.Header>
            <Card.Body>
                {loading ? (<div className="text-center"><Spinner animation="border" /></div>)
                : baoCaoData.length > 0 ? (
                    <Table bordered hover responsive>
                        <thead className="table-light"><tr><th>Lớp</th><th>Sĩ số</th><th>Số lượng đạt</th><th>Tỉ lệ (%)</th></tr></thead>
                        <tbody>{baoCaoData.map((row, idx) => (<tr key={idx}><td>{row.TenLop}</td><td>{row.SiSo}</td><td>{row.SoLuongDat}</td><td>{row.TiLe.toFixed(2)}</td></tr>))}</tbody>
                    </Table>
                ) : (
                    <p className="text-center text-muted p-3">Vui lòng chọn đủ bộ lọc để xem báo cáo.</p>
                )}
            </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default BaoCaoTongKetMon;