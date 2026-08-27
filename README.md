# 🎓 Ứng Dụng Quản Lý Sinh Viên - MongoDB & .NET Core API

## 📖 Giới thiệu Dự án
Ứng dụng Quản lý Sinh viên là giải pháp số hóa quy trình theo dõi và đánh giá thông tin học tập của sinh viên. 
- **Vấn đề giải quyết**: Khắc phục sự cồng kềnh, kém linh hoạt của cơ sở dữ liệu quan hệ truyền thống khi cần lưu trữ lượng dữ liệu thay đổi liên tục và đa chiều (như danh sách môn học, chứng chỉ ngoại ngữ).
- **Đối tượng sử dụng**: Phòng đào tạo, Cán bộ quản lý sinh viên tại các trường Đại học/Cao đẳng.
- **Tại sao xây dựng**: Nhằm tối ưu hóa hiệu suất truy vấn thống kê lớn và đem lại trải nghiệm quản trị trực quan, tốc độ phản hồi mượt mà (dưới dạng Single Page Application).
- **Phương pháp chính**: Ứng dụng mô hình NoSQL với cơ sở dữ liệu Document-based (MongoDB), kết hợp sức mạnh của Aggregation Framework để phân tích, thống kê dữ liệu trực tiếp tại database.

## ⚙️ Công nghệ sử dụng
- **Backend**: C# .NET Core 8.0 Web API
- **Database**: MongoDB (Tương tác qua thư viện `MongoDB.Driver`)
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6)
- **Thư viện UI/UX**: Chart.js (Vẽ biểu đồ tương tác), SweetAlert2 (Popup thông báo), FontAwesome (Hệ thống Icons)

## 🚀 Các chức năng chính
- **Quản lý Sinh viên (CRUD)**: Thêm, sửa, xóa, và theo dõi hồ sơ sinh viên đầy đủ chi tiết.
- **Tối ưu Tìm kiếm & Phân trang**: Tìm kiếm tuyệt đối/tương đối tự động theo Tên & Mã SV; phân trang danh sách động (25 sinh viên/trang).
- **Mảng động (Dynamic Arrays)**: Thêm/Sửa/Xóa không giới hạn Môn học và Ngoại ngữ cho từng hồ sơ mà không cần thiết kế bảng phụ (Sử dụng toán tử `$push`, `$pull`, và positional update `$`).
- **Dashboard Thống kê Nâng cao**: 
  - Tính điểm trung bình (GPA), tỷ lệ Nam/Nữ của toàn trường.
  - Phân loại học lực sinh viên (Xuất sắc, Giỏi, Khá, TB/Yếu) bằng cú pháp `$bucket`.
  - Thống kê độ phổ biến ngôn ngữ bằng `$unwind` kết hợp `$group`.
- **Tự động hóa CSDL**: Tự động đánh `Unique Index` (chống trùng lặp Mã SV), `Compound Index` (tối ưu tìm kiếm), và tự động tạo (seed) 20 dữ liệu sinh viên mẫu ở lần khởi chạy đầu tiên.

## 📸 Giao diện Ứng dụng
### 1. Quản lý Sinh viên
<img src="StudentManagement/docs/images/student_list.png" width="100%" alt="Danh sách Sinh viên">

### 2. Dashboard Thống Kê
<img src="StudentManagement/docs/images/dashboard.png" width="100%" alt="Dashboard Giao Diện">

--- 
## 📂 Cấu trúc thư mục (Folder Structure)
```text
StudentManagement/
├── Controllers/        # Xử lý các HTTP request từ client (StudentsController)
├── Data/               # Kết nối CSDL và Khởi tạo Seed Data/Index (DatabaseSeeder)
├── DTOs/               # Các lớp Data Transfer Object truyền tải dữ liệu
├── Models/             # Khai báo cấu trúc Document của MongoDB (Student)
├── Repositories/       # Chứa các câu truy vấn tương tác trực tiếp với MongoDB
├── Services/           # Xử lý logic nghiệp vụ, tính toán (GPA, Phân loại)
├── wwwroot/            # Nơi chứa mã nguồn Frontend
│   ├── css/            # Các file style định dạng giao diện (style.css)
│   ├── js/             # Logic Frontend, xử lý sự kiện, gọi API (app.js)
│   └── index.html      # Giao diện chính (Dashboard & Danh sách)
├── docs/images/        # Chứa hình ảnh minh họa hiển thị cho README
├── Program.cs          # File khởi chạy và cấu hình Pipeline của .NET Core
└── appsettings.json    # File cấu hình ứng dụng (có thể cấu hình ConnectionString)
```
---
## 🛠 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Yêu cầu hệ thống
* .NET SDK 8.0 (hoặc bản tương thích .NET Core API).
* MongoDB Server (Bản Local 5.0+ hoặc MongoDB Atlas).
* Trình duyệt web (Chrome, Edge, Firefox...).

### 2. Cấu hình Chuỗi kết nối (Connection String)
Ứng dụng sử dụng `dotnet user-secrets` để bảo mật chuỗi kết nối. Bạn cần trỏ ứng dụng tới database MongoDB của mình (Local hoặc Atlas).

Mở Terminal (Command Prompt/PowerShell) tại thư mục `StudentManagement` (nơi chứa file `.csproj`) và chạy lệnh sau:
```bash
# Khởi tạo user-secrets (nếu chưa có)
dotnet user-secrets init

# Cấu hình Connection String
dotnet user-secrets set "MongoDB:ConnectionString" "mongodb://localhost:27017"
# (Thay thế URL trên bằng URL MongoDB Atlas của bạn nếu dùng Cloud)

# Cấu hình tên Database
dotnet user-secrets set "MongoDB:DatabaseName" "qlsinhvien_db"

*(Lưu ý: Nếu không dùng `user-secrets`, bạn có thể thêm trực tiếp block `"MongoDB"` vào file `appsettings.json` ở thư mục gốc).*

### 3. Cài đặt Dependencies (Thư viện)
Ứng dụng sử dụng thư viện Driver chính thức của MongoDB. Để cài đặt/khôi phục thư viện, chạy lệnh:
```bash
dotnet restore
```
Gói thư viện chính được sử dụng:
* `MongoDB.Driver`

### 4. Khởi chạy Ứng dụng
Sau khi cấu hình xong, chạy lệnh sau để khởi động Backend Server:
```bash
dotnet run
```
*   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5195` (hoặc cổng tương tự được báo trong console).
*   Mở trình duyệt và truy cập vào địa chỉ trên (ví dụ: `http://localhost:5195/index.html`) để sử dụng toàn bộ giao diện quản trị trực quan.

> **💡 Lưu ý về Dữ liệu mẫu (Seed Data)**: Khi chạy lệnh `dotnet run` lần đầu tiên, hệ thống sẽ tự động quét cơ sở dữ liệu. Nếu chưa có dữ liệu, nó sẽ tự động chạy file `DatabaseSeeder.cs`, tạo 2 Indexes tối ưu hóa và bơm 20 sinh viên mẫu vào CSDL để bạn có thể xem Dashboard và danh sách ngay lập tức!


