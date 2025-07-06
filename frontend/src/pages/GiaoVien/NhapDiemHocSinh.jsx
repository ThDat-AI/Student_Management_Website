import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Spinner,
  Alert
} from "react-bootstrap";
import api from "../../api";

const NhapDiemHocSinh = () => {
  const [filters, setFilters] = useState({
    nienKhoa: "", lopHoc: "", monHoc: "", hocKy: ""
  });

  const [dropdowns, setDropdowns] = useState({
    nienKhoaList: [], lopHocList: [], monHocList: [], hocKyList: []
  });

  const [hocSinhData, setHocSinhData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [diemDatMon, setDiemDatMon] = useState(5.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fieldLabels = {
    nienKhoa: "niên khóa",
    lopHoc: "lớp học",
    monHoc: "môn học",
    hocKy: "học kỳ"
  };

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
        monHocList: mh.data,
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
    if (nienKhoa && lopHoc && monHoc && hocKy) {
      try {
        setLoading(true);
        const res = await api.get("/api/grading/diemso/", {
          params: {
            IDNienKhoa: nienKhoa,
            IDLopHoc: lopHoc,
            IDMonHoc: monHoc,
            IDHocKy: hocKy,
          },
        });
        setHocSinhData(res.data);
      } catch (err) {
        setError("Lỗi khi tải bảng điểm: " + err.message);
      } finally {
        setLoading(false);
      }
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
          Diem1Tiet: hs.Diem1Tiet === "" ? null : parseFloat(hs.Diem1Tiet),
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

  useEffect(() => {
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
    if (nienKhoa && lopHoc && monHoc && hocKy) {
      fetchBangDiem();
    }
  }, [filters]);

  return (
    <Container className="mt-4">
      <h3 className="mb-3">Nhập điểm học sinh</h3>

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
      ) : (
        hocSinhData.length > 0 ? (
          <Table bordered hover>
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
                const ketQua = diemTB === "" ? "" : (parseFloat(diemTB) >= diemDatMon ? "Đạt" : "Không đạt");
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
        ) : (
          <p>Không có dữ liệu bảng điểm.</p>
        )
      )}

      {hocSinhData.length > 0 && (
        <div className="d-flex gap-2 mt-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Sửa điểm</Button>
          ) : (
            <>
              <Button variant="success" onClick={handleLuuDiem}>Lưu điểm</Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Hủy</Button>
            </>
          )}
        </div>
      )}
    </Container>
  );
};

export default NhapDiemHocSinh;
