import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Form, Button, Table, Spinner, Alert } from "react-bootstrap";
import { FaClipboardList, FaFileExcel } from "react-icons/fa";
import { useLayout } from "../../contexts/LayoutContext";
import api from "../../api";
import { toast } from "react-toastify";
import '../../assets/styles/GiaoVienDashboard.css';

// HÀM HELPER: "Hiểu" đúng giá trị điểm từ input thô để tính toán real-time
const getNumericValue = (formattedValue) => {
    if (formattedValue === '' || formattedValue === null) return null;
    const cleanValue = String(formattedValue).replace(/\.$/, '');
    if (cleanValue === '') return null;
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
};

// HÀM HELPER: Xử lý input để luôn hiển thị dạng x.xx
const handleNumericInput = (currentValue, newInput) => {
    if (newInput === '') return '';
    const cleanInput = newInput.replace(/[^0-9.]/g, '');
    const parts = cleanInput.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    if (cleanInput.includes('.')) {
        const [integerPart, decimalPart] = cleanInput.split('.');
        const limitedInteger = integerPart.slice(0, 2);
        const limitedDecimal = decimalPart ? decimalPart.slice(0, 2) : '';
        return limitedInteger + '.' + limitedDecimal;
    }
    const limitedInput = cleanInput.slice(0, 2);
    if (limitedInput.length === 1 && parseInt(limitedInput) > 1) {
        return limitedInput.charAt(0) + '.' + limitedInput.charAt(1);
    } else if (limitedInput === '10') {
        return '10';
    } else if (limitedInput.length === 2 && limitedInput !== '10') {
        return limitedInput.charAt(0) + '.' + limitedInput.charAt(1);
    }
    return limitedInput;
};

// HÀM HELPER: Kiểm tra tính hợp lệ của điểm
const isValidDiem = (value) => {
    if (value === '' || value === null) return true; // Cho phép trống
    const num = getNumericValue(value);
    return num !== null && num >= 0 && num <= 10;
};


const NhapDiemHocSinh = () => {
  const [filters, setFilters] = useState({ nienKhoa: "", lopHoc: "", monHoc: "", hocKy: "" });
  const [dropdowns, setDropdowns] = useState({ nienKhoaList: [], lopHocList: [], monHocList: [], hocKyList: [] });
  const [hocSinhData, setHocSinhData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [diemDatMon, setDiemDatMon] = useState(5.0);
  const [loading, setLoading] = useState(false);
  const [invalidInputs, setInvalidInputs] = useState({});

  const { setPageTitle } = useLayout();

  const fieldLabels = { nienKhoa: "niên khóa", lopHoc: "lớp học", monHoc: "môn học", hocKy: "học kỳ" };

  useEffect(() => {
    document.title = "Quản lý điểm";
    setPageTitle("Nhập điểm học sinh");
    fetchDropdowns();
    fetchDiemDatMon();
  }, [setPageTitle]);

  useEffect(() => {
    if (filters.nienKhoa) {
      fetchLopHoc(filters.nienKhoa);
      setFilters(prev => ({ ...prev, lopHoc: "", monHoc: "" }));
    } else { setDropdowns(prev => ({...prev, lopHocList: [], monHocList: []})) }
  }, [filters.nienKhoa]);

  useEffect(() => {
    if (filters.lopHoc) {
      fetchMonHocTheoLop(filters.lopHoc);
      setFilters(prev => ({ ...prev, monHoc: "" }));
    } else { setDropdowns(prev => ({...prev, monHocList: []})) }
  }, [filters.lopHoc]);
  
  const fetchBangDiem = useCallback(async () => {
    const { nienKhoa, lopHoc, monHoc, hocKy } = filters;
    if (!nienKhoa || !lopHoc || !monHoc || !hocKy) {
      setHocSinhData([]);
      setIsEditing(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/api/grading/diemso/", {
        params: { IDNienKhoa: nienKhoa, IDLopHoc: lopHoc, IDMonHoc: monHoc, IDHocKy: hocKy }
      });
      const formattedData = (res.data || []).map(hs => ({
          ...hs,
          Diem15: hs.Diem15 !== null ? parseFloat(hs.Diem15).toFixed(2) : null,
          Diem1Tiet: hs.Diem1Tiet !== null ? parseFloat(hs.Diem1Tiet).toFixed(2) : null,
      }));
      setHocSinhData(formattedData);
      if(formattedData.length > 0){
        toast.success(`Tải thành công bảng điểm của ${formattedData.length} học sinh.`);
      } else {
        toast.info("Chưa có dữ liệu điểm cho lựa chọn này.");
      }
    } catch (err) {
      toast.error("Lỗi khi tải bảng điểm: " + (err.response?.data?.detail || err.message));
      setHocSinhData([]);
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  }, [filters]);

  useEffect(() => { fetchBangDiem(); }, [fetchBangDiem]);

  const fetchDropdowns = async () => {
    try {
      const [nk, hk] = await Promise.all([
        api.get("/api/students/filters/nienkhoa/"),
        api.get("/api/grading/hocky-list/")
      ]);
      setDropdowns(prev => ({ ...prev, nienKhoaList: nk.data || [], hocKyList: hk.data || [] }));
    } catch (err) { toast.error("Lỗi khi tải bộ lọc: " + (err.response?.data?.detail || err.message)); }
  };

  const fetchLopHoc = async (nienKhoaId) => {
    try {
      const res = await api.get(`/api/classes/lophoc-list/?nienkhoa_id=${nienKhoaId}`);
      setDropdowns(prev => ({ ...prev, lopHocList: res.data || [] }));
    } catch (err) { toast.error("Lỗi khi tải danh sách lớp học."); }
  };

  const fetchMonHocTheoLop = async (lopHocId) => {
    try {
      const res = await api.get(`/api/classes/monhoc-theo-lop/?lop_hoc_id=${lopHocId}`);
      setDropdowns(prev => ({ ...prev, monHocList: res.data || [] }));
    } catch (err) { toast.error("Lỗi khi tải danh sách môn học."); }
  };

  const fetchDiemDatMon = async () => {
    try {
      const res = await api.get("/api/configurations/quydinh/latest/");
      setDiemDatMon(res.data?.DiemDatMon || 5.0);
    } catch (err) { console.warn("Không thể tải điểm đạt môn. Dùng mặc định 5.0"); }
  };
  
  const handleChangeDiem = (index, field, newValue) => {
    const processedValue = handleNumericInput(hocSinhData[index][field] || '', newValue);
    const updatedData = [...hocSinhData];
    updatedData[index] = { ...updatedData[index], [field]: processedValue };
    setHocSinhData(updatedData);
    setInvalidInputs(prev => ({ ...prev, [`${index}-${field}`]: !isValidDiem(processedValue) }));
  };

  const handleBlurDiem = (index, field) => {
    const currentValue = String(hocSinhData[index][field] || '');
    if (currentValue === '') return;
    if (isValidDiem(currentValue)) {
        const numericValue = getNumericValue(currentValue);
        const updatedData = [...hocSinhData];
        updatedData[index] = { ...updatedData[index], [field]: numericValue !== null ? numericValue.toFixed(2) : null };
        setHocSinhData(updatedData);
    }
  };

  const handleLuuDiem = async () => {
    const hasErrors = Object.values(invalidInputs).some(isInvalid => isInvalid);
    if (hasErrors) {
      toast.warn("Có điểm không hợp lệ (phải từ 0 đến 10). Vui lòng kiểm tra lại.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/grading/diemso/cap-nhat-hang-loat/", {
          IDLopHoc: filters.lopHoc,
          IDMonHoc: filters.monHoc,
          IDHocKy: filters.hocKy,
          diem_data: hocSinhData.map(hs => ({
              IDHocSinh: hs.id,
              Diem15: getNumericValue(hs.Diem15),
              Diem1Tiet: getNumericValue(hs.Diem1Tiet)
          }))
      });
      toast.success("Lưu điểm thành công!");
      setIsEditing(false);
      await fetchBangDiem();
    } catch (err) {
      toast.error("Lỗi khi lưu điểm: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const tinhDiemTB = (formattedValue15, formattedValue1Tiet) => {
    const d1 = getNumericValue(formattedValue15);
    const d2 = getNumericValue(formattedValue1Tiet);
    if (d1 === null || d2 === null) return "";
    return ((d1 + 2 * d2) / 3).toFixed(2);
  };

  const exportBangDiemExcel = async () => {
    const { nienKhoa, lopHoc, monHoc, hocKy } = filters;
    try {
      const res = await api.get("/api/grading/diemso/xuat-excel/", {
        params: { IDNienKhoa: nienKhoa, IDLopHoc: lopHoc, IDMonHoc: monHoc, IDHocKy: hocKy },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bang_diem.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Đã bắt đầu xuất file Excel.");
    } catch (err) {
      toast.error("Lỗi khi xuất Excel: " + (err.response?.data?.detail || "Không có dữ liệu để xuất"));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setInvalidInputs({});
    fetchBangDiem();
  };

  return (
    <div className="dashboard-container">
      <Container fluid className="px-4 py-4">
        <div className="welcome-banner p-4 rounded-4 position-relative overflow-hidden mb-4">
          <div className="banner-bg-animation">{[...Array(5)].map((_, i) => <div key={i} className={`floating-orb orb-${i + 1}`}></div>)}</div>
          <div className="welcome-content d-flex align-items-center">
            <div className="banner-avatar-section me-4"><div className="avatar-container"><div className="avatar-main"><div className="avatar-placeholder"><FaClipboardList size={32} className="text-white avatar-icon" /></div></div></div></div>
            <div><h2 className="text-white mb-1 fw-bold banner-title">Nhập điểm học sinh</h2><p className="text-white-75 mb-0 banner-subtitle">Chỉnh sửa và quản lý điểm số của học sinh</p></div>
          </div>
        </div>
        
        <Row className="mb-3 g-3">
            <Col md={3}><Form.Select value={filters.nienKhoa} onChange={(e) => setFilters(prev => ({...prev, nienKhoa: e.target.value}))}><option value="">Chọn {fieldLabels.nienKhoa}</option>{dropdowns.nienKhoaList.map(item => <option key={item.id} value={item.id}>{item.TenNienKhoa}</option>)}</Form.Select></Col>
            <Col md={3}><Form.Select value={filters.lopHoc} onChange={(e) => setFilters(prev => ({...prev, lopHoc: e.target.value}))} disabled={!filters.nienKhoa}><option value="">Chọn {fieldLabels.lopHoc}</option>{dropdowns.lopHocList.map(item => <option key={item.id} value={item.id}>{item.TenLop}</option>)}</Form.Select></Col>
            <Col md={3}><Form.Select value={filters.monHoc} onChange={(e) => setFilters(prev => ({...prev, monHoc: e.target.value}))} disabled={!filters.lopHoc}><option value="">Chọn {fieldLabels.monHoc}</option>{dropdowns.monHocList.map(item => <option key={item.id} value={item.id}>{item.TenMonHoc}</option>)}</Form.Select></Col>
            <Col md={3}><Form.Select value={filters.hocKy} onChange={(e) => setFilters(prev => ({...prev, hocKy: e.target.value}))}><option value="">Chọn {fieldLabels.hocKy}</option>{dropdowns.hocKyList.map(item => <option key={item.id} value={item.id}>{item.TenHocKy}</option>)}</Form.Select></Col>
        </Row>

        {loading ? (<div className="text-center my-4"><Spinner animation="border" /></div>) 
        : hocSinhData.length > 0 ? (
          <>
            <Table bordered hover responsive>
              <thead><tr><th>Học sinh</th><th>Điểm 15 phút</th><th>Điểm 1 tiết</th><th>Điểm TB</th><th>Kết quả</th></tr></thead>
              <tbody>
                {hocSinhData.map((hs, index) => {
                  const diemTB = tinhDiemTB(hs.Diem15, hs.Diem1Tiet);
                  const ketQua = diemTB === "" ? "" : parseFloat(diemTB) >= diemDatMon ? "Đạt" : "Không đạt";
                  return (
                    <tr key={hs.id}>
                      <td>{hs.HoTen}</td>
                      <td>{isEditing ? <Form.Control type="text" inputMode="decimal" value={hs.Diem15 ?? ""} isInvalid={invalidInputs[`${index}-Diem15`]} onChange={(e) => handleChangeDiem(index, "Diem15", e.target.value)} onBlur={() => handleBlurDiem(index, "Diem15")} maxLength={5} placeholder="0-10" /> : hs.Diem15 ?? "-"}</td>
                      <td>{isEditing ? <Form.Control type="text" inputMode="decimal" value={hs.Diem1Tiet ?? ""} isInvalid={invalidInputs[`${index}-Diem1Tiet`]} onChange={(e) => handleChangeDiem(index, "Diem1Tiet", e.target.value)} onBlur={() => handleBlurDiem(index, "Diem1Tiet")} maxLength={5} placeholder="0-10" /> : hs.Diem1Tiet ?? "-"}</td>
                      <td>{diemTB}</td>
                      <td className={ketQua === 'Đạt' ? 'text-success fw-bold' : (ketQua === 'Không đạt' ? 'text-danger fw-bold' : '')}>{ketQua}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="d-flex gap-2 mt-3">
              {!isEditing ? (<><Button onClick={() => setIsEditing(true)}>Sửa điểm</Button><Button variant="success" onClick={exportBangDiemExcel}><FaFileExcel className="me-2" />Xuất Excel</Button></>) 
              : (<><Button variant="success" onClick={handleLuuDiem}>Lưu điểm</Button><Button variant="secondary" onClick={handleCancelEdit}>Hủy</Button></>)}
            </div>
          </>
        ) 
        : <Alert variant="info">Vui lòng chọn đầy đủ bộ lọc để xem hoặc nhập điểm.</Alert>}
      </Container>
    </div>
  );
};

export default NhapDiemHocSinh;