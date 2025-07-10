import React, { useEffect, useState, useCallback, useContext } from "react";
import { Container, Row, Col, Form, Button, Table, Spinner, Alert, Card } from "react-bootstrap";
import { FaClipboardList, FaFileExcel, FaLock, FaUnlock, FaPencilAlt } from "react-icons/fa";
import { useLayout } from "../../contexts/LayoutContext";
import { useAuth } from "../../contexts/AuthContext";
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

// HÀM HELPER: Xử lý input để luôn hiển thị dạng x.xx và giới hạn 0-10
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
        const result = limitedInteger + '.' + limitedDecimal;
        const numValue = parseFloat(limitedInteger + '.' + (limitedDecimal || '0'));
        if (numValue > 10) {
            return '10.00';
        }
        return result;
    }
    if (cleanInput.length === 1) {
        return cleanInput;
    } else if (cleanInput.length === 2) {
        const firstDigit = cleanInput[0];
        const secondDigit = cleanInput[1];
        if (firstDigit === '1' && secondDigit <= '0') {
            return cleanInput;
        } else if (firstDigit === '1' && secondDigit > '0') {
            return firstDigit + '.' + secondDigit;
        } else if (firstDigit >= '2') {
            return firstDigit + '.' + secondDigit;
        } else {
            return firstDigit + '.' + secondDigit;
        }
    } else {
        const limitedInput = cleanInput.slice(0, 2);
        if (limitedInput === '10') {
            return '10';
        }
        const firstDigit = limitedInput[0];
        const secondDigit = limitedInput[1];
        return firstDigit + '.' + secondDigit;
    }
};

// HÀM HELPER: Kiểm tra tính hợp lệ của điểm
const isValidDiem = (value) => {
    if (value === '' || value === null) return true; // Cho phép trống
    const num = getNumericValue(value);
    return num !== null && num >= 0 && num <= 10;
};


const NhapDiemHocSinh = () => {
    const [filters, setFilters] = useState({ lopHoc: "", monHoc: "", hocKy: "" });
    const [latestNienKhoaInfo, setLatestNienKhoaInfo] = useState(null);
    const [dropdowns, setDropdowns] = useState({ lopHocList: [], monHocList: [], hocKyList: [] });
    const [hocSinhData, setHocSinhData] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [canEditScores, setCanEditScores] = useState(true);
    const [thamSo, setThamSo] = useState(null);
    const [diemDatMon, setDiemDatMon] = useState(5.0);
    const [invalidInputs, setInvalidInputs] = useState({});

    const { setPageTitle } = useLayout();
    const { user } = useAuth();

    // 1. Fetch dữ liệu ban đầu
    useEffect(() => {
        document.title = "Bảng điểm";
        setPageTitle("Nhập/Sửa bảng điểm");

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/configurations/quydinh/latest/');
                const latestQuyDinh = res.data;

                if (latestQuyDinh?.IDNienKhoa) {
                    setLatestNienKhoaInfo({ id: latestQuyDinh.IDNienKhoa, ten: latestQuyDinh.TenNienKhoa });
                    setThamSo(latestQuyDinh);
                    setDiemDatMon(latestQuyDinh.DiemDatMon || 5.0);

                    const [lopHocRes, hocKyRes] = await Promise.all([
                        api.get(`/api/classes/lophoc-list/?nienkhoa_id=${latestQuyDinh.IDNienKhoa}`),
                        api.get("/api/grading/hocky-list/")
                    ]);
                    setDropdowns({ lopHocList: lopHocRes.data || [], monHocList: [], hocKyList: hocKyRes.data || [] });
                } else {
                    toast.error("Hệ thống chưa có niên khóa nào đang hoạt động.");
                }
            } catch (err) {
                toast.error("Lỗi khi tải dữ liệu ban đầu.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [setPageTitle]);
    
    // 2. Fetch môn học khi lớp học thay đổi
    useEffect(() => {
        // Tối ưu: Chỉ fetch dữ liệu, không set lại filter ở đây
        const fetchMonHoc = async () => {
            if (filters.lopHoc) {
                try {
                    const res = await api.get(`/api/classes/monhoc-theo-lop/?lop_hoc_id=${filters.lopHoc}`);
                    setDropdowns(prev => ({ ...prev, monHocList: res.data || [] }));
                } catch (err) { 
                    toast.error("Lỗi khi tải danh sách môn học."); 
                    setDropdowns(prev => ({ ...prev, monHocList: [] })); // Đảm bảo reset nếu lỗi
                }
            } else {
                setDropdowns(prev => ({ ...prev, monHocList: [] }));
            }
        };
        fetchMonHoc();
    }, [filters.lopHoc]);

    // 3. Cập nhật quyền sửa điểm trên client
    useEffect(() => {
        if (user.role === 'BGH' || user.role === 'GiaoVu') { setCanEditScores(true); return; }
        if (!thamSo || !filters.hocKy) { setCanEditScores(true); return; }
        const hocKyId = parseInt(filters.hocKy);
        setCanEditScores(hocKyId === 1 ? thamSo.ChoPhepSuaDiemHK1 : (hocKyId === 2 ? thamSo.ChoPhepSuaDiemHK2 : true));
    }, [thamSo, filters.hocKy, user.role]);

    // 4. Fetch bảng điểm khi bộ lọc thay đổi
    const fetchBangDiem = useCallback(async () => {
        const { lopHoc, monHoc, hocKy } = filters;
        if (!lopHoc || !monHoc || !hocKy) {
            setHocSinhData([]);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("/api/grading/diemso/", { params: { IDLopHoc: lopHoc, IDMonHoc: monHoc, IDHocKy: hocKy } });
            const formattedData = (res.data || []).map(hs => ({
                ...hs,
                Diem15: hs.Diem15 !== null ? parseFloat(hs.Diem15).toFixed(2) : null,
                Diem1Tiet: hs.Diem1Tiet !== null ? parseFloat(hs.Diem1Tiet).toFixed(2) : null,
            }));
            setHocSinhData(formattedData);
        } catch (err) {
            toast.error("Lỗi khi tải bảng điểm: " + (err.response?.data?.detail || err.message));
            setHocSinhData([]);
        } finally {
            setLoading(false);
            setIsEditing(false); // Đảm bảo thoát chế độ edit khi tải lại
        }
    }, [filters]);

    useEffect(() => { fetchBangDiem(); }, [fetchBangDiem]);

    // 5. BÁO LỖI NGAY LẬP TỨC KHI BẤM NÚT
    const handleStartEditing = () => {
        if (!canEditScores) {
            toast.warn("Chức năng sửa điểm đã bị khóa cho học kỳ này.");
            return; // Chặn hành động
        }
        setIsEditing(true);
    };
    
    const handleCancelEdit = () => {
        setIsEditing(false);
        setInvalidInputs({});
        fetchBangDiem(); // Tải lại dữ liệu gốc
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

        // FIX 2: Chụp lại state của bộ lọc trước khi thực hiện hành động bất đồng bộ
        const filtersAtSaveStart = { ...filters };

        setLoading(true);
        const promises = hocSinhData.map(hs =>
            api.post("/api/grading/diemso/cap-nhat/", {
                IDHocSinh: hs.id,
                IDLopHoc: filters.lopHoc,
                IDMonHoc: filters.monHoc,
                IDHocKy: filters.hocKy,
                Diem15: getNumericValue(hs.Diem15),
                Diem1Tiet: getNumericValue(hs.Diem1Tiet)
            })
        );
        
        try {
            await toast.promise(Promise.all(promises), {
              pending: 'Đang lưu điểm...',
              success: 'Lưu điểm thành công!',
              error: 'Có lỗi xảy ra khi lưu điểm!'
            });
            
            // FIX 2: Chỉ tải lại dữ liệu nếu người dùng vẫn đang ở cùng bộ lọc
            // Nếu người dùng đã đổi lớp/môn trong lúc lưu, không làm gì cả
            // để tránh ghi đè lên hành động mới của họ.
            if (
                filters.lopHoc === filtersAtSaveStart.lopHoc &&
                filters.monHoc === filtersAtSaveStart.monHoc &&
                filters.hocKy === filtersAtSaveStart.hocKy
            ) {
                setIsEditing(false);
                await fetchBangDiem(); // Tải lại dữ liệu mới sau khi lưu
            } else {
                 // Nếu người dùng đã đổi bộ lọc, chỉ cần thoát chế độ chỉnh sửa.
                 // useEffect của bộ lọc mới đã tự xử lý việc dọn dẹp/tải dữ liệu.
                setIsEditing(false);
            }

        } catch (err) {
            // Toast promise đã xử lý hiển thị lỗi, chỉ log ra để debug nếu cần
            console.error("Lỗi khi lưu điểm:", err);
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
        if (!latestNienKhoaInfo?.id) return;
        try {
            const res = await api.get("/api/grading/diemso/xuat-excel/", {
                params: {
                    IDNienKhoa: latestNienKhoaInfo.id,
                    IDLopHoc: filters.lopHoc,
                    IDMonHoc: filters.monHoc,
                    IDHocKy: filters.hocKy
                },
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
            toast.error("Lỗi khi xuất Excel: Không có dữ liệu để xuất");
        }
    };

    // FIX 1: Khi chọn lớp mới, reset luôn môn học và bảng điểm trong một hành động
    const handleLopHocChange = (e) => {
        const newLopHocId = e.target.value;
        setFilters(prev => ({
            ...prev,
            lopHoc: newLopHocId,
            monHoc: "" // Reset môn học ngay lập tức
        }));
        // Việc reset monHoc sẽ tự động kích hoạt useEffect để dọn dẹp hocSinhData
    };

    return (
        <div className="dashboard-container">
            <Container fluid className="px-4 py-4">
                <div className="welcome-banner p-4 rounded-4 position-relative overflow-hidden mb-4">
                    <div className="banner-bg-animation">{[...Array(5)].map((_, i) => <div key={i} className={`floating-orb orb-${i + 1}`}></div>)}</div>
                    <div className="welcome-content d-flex align-items-center">
                        <div className="banner-avatar-section me-4"><div className="avatar-container"><div className="avatar-main"><div className="avatar-placeholder"><FaClipboardList size={32} className="text-white avatar-icon" /></div></div></div></div>
                        <div><h2 className="text-white mb-1 fw-bold banner-title">Nhập/Sửa bảng điểm</h2><p className="text-white-75 mb-0 banner-subtitle">Quản lý điểm số cho học sinh trong niên khóa hiện tại</p></div>
                    </div>
                </div>
                
                <Card className="shadow-sm mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="mb-0">Bảng điểm</h5>
                        {latestNienKhoaInfo && <span className="badge bg-primary fs-6">Niên khóa: {latestNienKhoaInfo.ten}</span>}
                    </Card.Header>
                    <Card.Body>
                        <Row className="mb-3 g-3">
                            {/* FIX 1: Sử dụng handler tùy chỉnh */}
                            <Col md={4}>
                                <Form.Select value={filters.lopHoc} onChange={handleLopHocChange} disabled={loading}>
                                    <option value="">Chọn Lớp học</option>
                                    {dropdowns.lopHocList.map(item => <option key={item.id} value={item.id}>{item.TenLop}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={4}><Form.Select value={filters.monHoc} onChange={(e) => setFilters(prev => ({...prev, monHoc: e.target.value}))} disabled={!filters.lopHoc}><option value="">Chọn Môn học</option>{dropdowns.monHocList.map(item => <option key={item.id} value={item.id}>{item.TenMonHoc}</option>)}</Form.Select></Col>
                            <Col md={4}><Form.Select value={filters.hocKy} onChange={(e) => setFilters(prev => ({...prev, hocKy: e.target.value}))} disabled={loading}><option value="">Chọn Học kỳ</option>{dropdowns.hocKyList.map(item => <option key={item.id} value={item.id}>{item.TenHocKy}</option>)}</Form.Select></Col>
                        </Row>
                        {thamSo && filters.hocKy && (
                            <Alert variant={canEditScores ? "success" : "warning"} className="d-flex align-items-center">
                                {canEditScores ? <FaUnlock className="me-2" /> : <FaLock className="me-2" />}
                                Chức năng nhập/sửa điểm hiện đang <span className="fw-bold mx-1">{canEditScores ? "MỞ" : "KHÓA"}</span>.
                            </Alert>
                        )}
                    </Card.Body>
                </Card>

                {loading && !hocSinhData.length ? (<div className="text-center my-4"><Spinner animation="border" /></div>) 
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
                            {!isEditing ? (
                                <>
                                    <Button onClick={handleStartEditing} disabled={!canEditScores} title={!canEditScores ? "Chức năng sửa điểm đã bị khóa" : "Sửa điểm"}>
                                        <FaPencilAlt className="me-2"/>Sửa điểm
                                    </Button>
                                    <Button variant="success" onClick={exportBangDiemExcel} disabled={!filters.lopHoc || !filters.monHoc || !filters.hocKy}>
                                        <FaFileExcel className="me-2" />Xuất Excel
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="success" onClick={handleLuuDiem}>Lưu điểm</Button>
                                    <Button variant="secondary" onClick={handleCancelEdit}>Hủy</Button>
                                </>
                            )}
                        </div>
                    </>
                ) 
                : <Alert variant="info">Vui lòng chọn đầy đủ bộ lọc để xem bảng điểm.</Alert>}
            </Container>
        </div>
    );
};

export default NhapDiemHocSinh;