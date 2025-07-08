import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Row, Col, Form, Button, Table, Spinner, Alert
} from "react-bootstrap";
import { FaClipboardList, FaFileExcel } from "react-icons/fa";
import { useLayout } from "../../contexts/LayoutContext";
import api from "../../api";
import '../../assets/styles/GiaoVienDashboard.css';

// HÀM HELPER: "Hiểu" đúng giá trị điểm từ input thô để tính toán real-time
const normalizeDiem = (value) => {
    if (value === '' || value === null) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
};

// HÀM HELPER: Chuẩn hóa và format điểm để hiển thị khi hoàn thành nhập
const formatDiemForDisplay = (value) => {
    if (value === '' || value === null) return '';
    
    const normalized = normalizeDiem(value);
    if (normalized === null) return value;
    
    // Giới hạn 2 chữ số sau dấu thập phân
    return normalized.toFixed(2);
};

// HÀM HELPER: Xử lý input để luôn hiển thị dạng x.xx
const handleNumericInput = (currentValue, newInput) => {
    // Nếu xóa hết
    if (newInput === '') return '';
    
    // Chỉ cho phép số và dấu chấm
    const cleanInput = newInput.replace(/[^0-9.]/g, '');
    
    // Nếu có nhiều hơn 1 dấu chấm, chỉ giữ lại dấu chấm đầu tiên
    const parts = cleanInput.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Nếu có dấu chấm
    if (cleanInput.includes('.')) {
        const [integerPart, decimalPart] = cleanInput.split('.');
        
        // Giới hạn phần nguyên 2 chữ số, phần thập phân 2 chữ số
        const limitedInteger = integerPart.slice(0, 2);
        const limitedDecimal = decimalPart ? decimalPart.slice(0, 2) : '';
        
        return limitedInteger + '.' + limitedDecimal;
    }
    
    // Nếu không có dấu chấm, giới hạn 2 chữ số
    const limitedInput = cleanInput.slice(0, 2);
    
    // Nếu có 1 chữ số, hiển thị x.
    // Nếu có 2 chữ số, hiển thị x.x
    if (limitedInput.length === 1) {
        return limitedInput + '.';
    } else if (limitedInput.length === 2) {
        return limitedInput.charAt(0) + '.' + limitedInput.charAt(1);
    }
    
    return limitedInput;
};

// HÀM HELPER: Kiểm tra tính hợp lệ của điểm
const isValidDiem = (value) => {
    if (value === '' || value === null) return true; // Cho phép trống
    
    // Loại bỏ dấu chấm ở cuối nếu có
    const cleanValue = value.replace(/\.$/, '');
    if (cleanValue === '') return true;
    
    const num = parseFloat(cleanValue);
    return !isNaN(num) && num >= 0 && num <= 10;
};

// HÀM HELPER: Lấy giá trị số thực từ input đã format
const getNumericValue = (formattedValue) => {
    if (formattedValue === '' || formattedValue === null) return null;
    
    // Loại bỏ dấu chấm ở cuối nếu có
    const cleanValue = formattedValue.replace(/\.$/, '');
    if (cleanValue === '') return null;
    
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
};

const NhapDiemHocSinh = () => {
  const [filters, setFilters] = useState({ nienKhoa: "", lopHoc: "", monHoc: "", hocKy: "" });
  const [dropdowns, setDropdowns] = useState({ nienKhoaList: [], lopHocList: [], monHocList: [], hocKyList: [] });
  const [hocSinhData, setHocSinhData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [diemDatMon, setDiemDatMon] = useState(5.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invalidInputs, setInvalidInputs] = useState({});

  const { setPageTitle } = useLayout();

  const fieldLabels = {
    nienKhoa: "niên khóa",
    lopHoc: "lớp học",
    monHoc: "môn học",
    hocKy: "học kỳ"
  };

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
    } else {
        setDropdowns(prev => ({...prev, lopHocList: [], monHocList: []}))
    }
  }, [filters.nienKhoa]);

  useEffect(() => {
    if (filters.lopHoc) {
      fetchMonHocTheoLop(filters.lopHoc);
      setFilters(prev => ({ ...prev, monHoc: "" }));
    } else {
        setDropdowns(prev => ({...prev, monHocList: []}))
    }
  }, [filters.lopHoc]);
  
  const fetchBangDiem = useCallback(async () => {
    const { nienKhoa, lopHoc, monHoc, hocKy } = filters;
    if (!nienKhoa || !lopHoc || !monHoc || !hocKy) {
      setHocSinhData([]);
      setIsEditing(false);
      return;
    }
    setLoading(true);
    setError("");
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
      if(formattedData.length === 0){
        setError("Chưa có dữ liệu điểm cho lựa chọn này.");
      }
    } catch (err) {
      setError("Lỗi khi tải bảng điểm: " + err.message);
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBangDiem();
  }, [fetchBangDiem]);

  const fetchDropdowns = async () => {
    try {
      const [nk, hk] = await Promise.all([
        api.get("/api/students/filters/nienkhoa/"),
        api.get("/api/grading/hocky-list/")
      ]);
      setDropdowns(prev => ({ ...prev, nienKhoaList: nk.data || [], hocKyList: hk.data || [] }));
    } catch (err) { setError("Lỗi khi tải dropdown: " + err.message); }
  };

  const fetchLopHoc = async (nienKhoaId) => {
    try {
      const res = await api.get(`/api/classes/lophoc-list/?nienkhoa_id=${nienKhoaId}`);
      setDropdowns(prev => ({ ...prev, lopHocList: res.data || [] }));
    } catch (err) { setError("Lỗi khi tải lớp học: " + err.message); }
  };

  const fetchMonHocTheoLop = async (lopHocId) => {
    try {
      const res = await api.get(`/api/classes/monhoc-theo-lop/?lop_hoc_id=${lopHocId}`);
      setDropdowns(prev => ({ ...prev, monHocList: res.data || [] }));
    } catch (err) { setError("Lỗi khi tải môn học theo lớp: " + err.message); }
  };

  const fetchDiemDatMon = async () => {
    try {
      const res = await api.get("/api/configurations/quydinh/latest/");
      setDiemDatMon(res.data?.DiemDatMon || 5.0);
    } catch (err) { console.warn("Không thể tải điểm đạt môn. Dùng mặc định 5.0"); }
  };
  
  // HÀM XỬ LÝ THAY ĐỔI ĐIỂM - cập nhật với logic mới
  const handleChangeDiem = (index, field, newValue) => {
    // Xử lý input để có format x.xx
    const processedValue = handleNumericInput(hocSinhData[index][field] || '', newValue);
    
    // Cập nhật dữ liệu
    const updatedData = [...hocSinhData];
    updatedData[index] = { ...updatedData[index], [field]: processedValue };
    setHocSinhData(updatedData);

    // Kiểm tra validation
    setInvalidInputs(prev => ({
        ...prev,
        [`${index}-${field}`]: !isValidDiem(processedValue)
    }));
  };

  // HÀM XỬ LÝ BLUR - hoàn thiện format khi rời khỏi input
  const handleBlurDiem = (index, field) => {
    const currentValue = hocSinhData[index][field];
    if (currentValue === '' || currentValue === null) return;
    
    // Nếu kết thúc bằng dấu chấm, thêm "00"
    if (currentValue.endsWith('.')) {
        const updatedData = [...hocSinhData];
        updatedData[index] = { ...updatedData[index], [field]: currentValue + '00' };
        setHocSinhData(updatedData);
    }
    // Nếu có 1 chữ số sau dấu chấm, thêm "0"
    else if (currentValue.includes('.') && currentValue.split('.')[1].length === 1) {
        const updatedData = [...hocSinhData];
        updatedData[index] = { ...updatedData[index], [field]: currentValue + '0' };
        setHocSinhData(updatedData);
    }
  };

  // HÀM LƯU ĐIỂM - cập nhật để dùng getNumericValue
  const handleLuuDiem = async () => {
    const hasErrors = Object.values(invalidInputs).some(isInvalid => isInvalid);
    if (hasErrors) {
      setError("Có điểm không hợp lệ (phải từ 0 đến 10). Vui lòng kiểm tra lại.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      for (const hs of hocSinhData) {
        await api.post("/api/grading/diemso/cap-nhat/", {
          IDHocSinh: hs.id,
          IDLopHoc: filters.lopHoc,
          IDMonHoc: filters.monHoc,
          IDHocKy: filters.hocKy,
          Diem15: getNumericValue(hs.Diem15),
          Diem1Tiet: getNumericValue(hs.Diem1Tiet)
        });
      }
      setIsEditing(false);
      await fetchBangDiem();
    } catch (err) {
      setError("Lỗi khi lưu điểm: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // HÀM TÍNH ĐIỂM TB - cập nhật để dùng getNumericValue
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
    } catch (err) {
      setError("Lỗi khi xuất Excel: " + (err.response?.data?.detail || "Không có dữ liệu để xuất"));
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
        {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
        <Row className="mb-3 g-3">
            <Col md={3}><Form.Select value={filters.nienKhoa} onChange={(e) => setFilters(prev => ({...prev, nienKhoa: e.target.value}))}><option value="">Chọn {fieldLabels.nienKhoa}</option>{dropdowns.nienKhoaList.map(item => <option key={item.id} value={item.id}>{item.TenNienKhoa}</option>)}</Form.Select></Col>
            <Col md={3}><Form.Select value={filters.lopHoc} onChange={(e) => setFilters(prev => ({...prev, lopHoc: e.target.value}))} disabled={!filters.nienKhoa}><option value="">Chọn {fieldLabels.lopHoc}</option>{dropdowns.lopHocList.map(item => <option key={item.id} value={item.id}>{item.TenLop}</option>)}</Form.Select></Col>
            <Col md={3}><Form.Select value={filters.monHoc} onChange={(e) => setFilters(prev => ({...prev, monHoc: e.target.value}))} disabled={!filters.lopHoc}><option value="">Chọn {fieldLabels.monHoc}</option>{dropdowns.monHocList.map(item => <option key={item.id} value={item.id}>{item.TenMonHoc}</option>)}</Form.Select></Col>
            <Col md={3}><Form.Select value={filters.hocKy} onChange={(e) => setFilters(prev => ({...prev, hocKy: e.target.value}))}><option value="">Chọn {fieldLabels.hocKy}</option>{dropdowns.hocKyList.map(item => <option key={item.id} value={item.id}>{item.TenHocKy}</option>)}</Form.Select></Col>
        </Row>
        {loading ? (<div className="text-center my-4"><Spinner animation="border" /></div>) : hocSinhData.length > 0 ? (
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
                      <td>
                        {isEditing ? (
                          <Form.Control 
                            type="text" 
                            inputMode="decimal" 
                            value={hs.Diem15 ?? ""} 
                            isInvalid={invalidInputs[`${index}-Diem15`]}
                            onChange={(e) => handleChangeDiem(index, "Diem15", e.target.value)}
                            onBlur={() => handleBlurDiem(index, "Diem15")}
                            maxLength={5}
                            placeholder="0-10"
                          />
                        ) : hs.Diem15 ?? "-"}
                      </td>
                      <td>
                        {isEditing ? (
                          <Form.Control 
                            type="text" 
                            inputMode="decimal" 
                            value={hs.Diem1Tiet ?? ""} 
                            isInvalid={invalidInputs[`${index}-Diem1Tiet`]}
                            onChange={(e) => handleChangeDiem(index, "Diem1Tiet", e.target.value)}
                            onBlur={() => handleBlurDiem(index, "Diem1Tiet")}
                            maxLength={5}
                            placeholder="0-10"
                          />
                        ) : hs.Diem1Tiet ?? "-"}
                      </td>
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
        ) : (!error && <Alert variant="info">Vui lòng chọn đầy đủ bộ lọc để xem hoặc nhập điểm.</Alert>)}
      </Container>
    </div>
  );
};

export default NhapDiemHocSinh;