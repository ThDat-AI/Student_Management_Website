USE QuanLyHocSinhDB;
GO

-- 1. Thêm học kỳ
INSERT INTO HOCKY (TenHocKy)
SELECT N'Học kỳ 1'
WHERE NOT EXISTS (SELECT 1 FROM HOCKY WHERE TenHocKy = N'Học kỳ 1');
INSERT INTO HOCKY (TenHocKy)
SELECT N'Học kỳ 2'
WHERE NOT EXISTS (SELECT 1 FROM HOCKY WHERE TenHocKy = N'Học kỳ 2');
GO

-- 2. Thêm vai trò
INSERT INTO VAITRO (MaVaiTro, TenVaiTro)
SELECT 'BGH', N'Ban Giám Hiệu'
WHERE NOT EXISTS (SELECT 1 FROM VAITRO WHERE MaVaiTro = 'BGH');
INSERT INTO VAITRO (MaVaiTro, TenVaiTro)
SELECT 'GiaoVu', N'Giáo Vụ'
WHERE NOT EXISTS (SELECT 1 FROM VAITRO WHERE MaVaiTro = 'GiaoVu');
INSERT INTO VAITRO (MaVaiTro, TenVaiTro)
SELECT 'GiaoVien', N'Giáo viên'
WHERE NOT EXISTS (SELECT 1 FROM VAITRO WHERE MaVaiTro = 'GiaoVien');
GO

-- 3. Thêm tổ hợp
INSERT INTO TOHOP (TenToHop)
SELECT N'Tự Nhiên'
WHERE NOT EXISTS (SELECT 1 FROM TOHOP WHERE TenToHop = N'Tự Nhiên');
INSERT INTO TOHOP (TenToHop)
SELECT N'Xã Hội'
WHERE NOT EXISTS (SELECT 1 FROM TOHOP WHERE TenToHop = N'Xã Hội');
GO

-- 4. Thêm người dùng với mật khẩu 'admin123@'
DECLARE @PasswordHash NVARCHAR(255) = 'pbkdf2_sha256$600000$teOe2PQ69YS692ZpT44zVJ$FUoH0i+xIyuOrLgczhWNHeI/rg2B8I0eOYuaYmMUky4=';

-- BGH
IF NOT EXISTS (SELECT 1 FROM auth_user WHERE username = 'bgh')
BEGIN
    INSERT INTO auth_user (password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined)
    VALUES (@PasswordHash, NULL, 1, 'bgh', '', '', 'bgh@example.com', 1, 1, GETDATE());
END
ELSE
BEGIN
    UPDATE auth_user SET password = @PasswordHash WHERE username = 'bgh';
END

-- GiaoVu
IF NOT EXISTS (SELECT 1 FROM auth_user WHERE username = 'giaovu')
BEGIN
    INSERT INTO auth_user (password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined)
    VALUES (@PasswordHash, NULL, 0, 'giaovu', '', '', 'giaovu@example.com', 1, 1, GETDATE());
END
ELSE
BEGIN
    UPDATE auth_user SET password = @PasswordHash WHERE username = 'giaovu';
END

-- GiaoVien
IF NOT EXISTS (SELECT 1 FROM auth_user WHERE username = 'giaovien')
BEGIN
    INSERT INTO auth_user (password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined)
    VALUES (@PasswordHash, NULL, 0, 'giaovien', '', '', 'giaovien@example.com', 1, 1, GETDATE());
END
ELSE
BEGIN
    UPDATE auth_user SET password = @PasswordHash WHERE username = 'giaovien';
END
GO

-- 5. Thêm vào bảng TAIKHOAN
-- GiaoVu
INSERT INTO TAIKHOAN (user_id, Ho, Ten, MaVaiTro_id, GioiTinh, NgaySinh, DiaChi, SoDienThoai, Email)
SELECT id, N'Nguyễn', N'Văn A', 'GiaoVu', N'Nam', '1995-01-01', N'Hà Nội', '0912345678', 'giaovu@example.com'
FROM auth_user WHERE username = 'giaovu'
AND NOT EXISTS (SELECT 1 FROM TAIKHOAN WHERE Email = 'giaovu@example.com');

-- GiaoVien
INSERT INTO TAIKHOAN (user_id, Ho, Ten, MaVaiTro_id, GioiTinh, NgaySinh, DiaChi, SoDienThoai, Email)
SELECT id, N'Trần', N'Thị B', 'GiaoVien', N'Nữ', '1990-02-02', N'TP HCM', '0911222333', 'giaovien@example.com'
FROM auth_user WHERE username = 'giaovien'
AND NOT EXISTS (SELECT 1 FROM TAIKHOAN WHERE Email = 'giaovien@example.com');

-- BGH
INSERT INTO TAIKHOAN (user_id, Ho, Ten, MaVaiTro_id, GioiTinh, NgaySinh, DiaChi, SoDienThoai, Email)
SELECT id, N'Lê', N'Văn C', 'BGH', N'Nam', '1985-03-03', N'Đà Nẵng', '0988777666', 'bgh@example.com'
FROM auth_user WHERE username = 'bgh'
AND NOT EXISTS (SELECT 1 FROM TAIKHOAN WHERE Email = 'bgh@example.com');
GO
