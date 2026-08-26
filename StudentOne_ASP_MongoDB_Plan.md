KẾ HOẠCH TRIỂN KHAI DỰ ÁN

**XÂY DỰNG ỨNG DỤNG WEB QUẢN LÝ SINH VIÊN VỚI MONGODB**

Phiên bản triển khai: ASP.NET Core Web API + MongoDB.Driver + MongoDB Atlas + HTML/CSS/JavaScript

Mục tiêu: Bám sát đầy đủ rubric 10 điểm của đề bài, đồng thời xây dựng ứng dụng web có kiến trúc rõ ràng, dễ demo và có khả năng triển khai trực tuyến.

# 1. TỔNG QUAN DỰ ÁN & CÔNG NGHỆ

|  |  |
| --- | --- |
| **Hạng mục** | **Lựa chọn / Đặc tả** |
| Tên dự án | Student Management System – Ứng dụng Web Quản lý Sinh viên |
| Backend | C# + ASP.NET Core Web API |
| MongoDB Driver | MongoDB.Driver (.NET) |
| Frontend | HTML + CSS + JavaScript; có thể dùng Bootstrap nếu cần |
| Database | MongoDB Atlas |
| Công cụ quản trị DB | MongoDB Compass |
| Kiến trúc | Web UI → Controller → Service/BLL → Repository/DAL → MongoDB.Driver → MongoDB Atlas |
| Cấu hình | appsettings.json; không hardcode connection string trong source code |
| Triển khai | Backend lên nền tảng hỗ trợ ASP.NET Core; MongoDB sử dụng Atlas |
| Repository mã nguồn | GitHub/GitLab |

# 2. THIẾT KẾ CSDL & DOCUMENT MODEL

Sử dụng một database duy nhất, ví dụ qlsinhvien\_db, với collection sinhvien. Thiết kế embedded document để thông tin ngoại ngữ và môn học nằm trong document sinh viên.

Document mẫu:

{  
 "\_id": ObjectId("..."),  
 "masv": "sv001",  
 "hoten": "Nguyễn Văn An",  
 "tuoi": 20,  
 "phai": "Nam",  
 "namhoc": "2023-2027",  
 "khoa": "Công nghệ thông tin",  
 "malop": "14DHTH01",  
 "ngoaingu": [  
 {  
 "tenNgoaiNgu": "Tiếng Anh",  
 "trinhDo": "B1",  
 "certLink": "https://example.com/cert/sv001-en",  
 "ghiChu": ""  
 },  
 {  
 "tenNgoaiNgu": "Tiếng Nhật",  
 "trinhDo": "N5",  
 "certLink": "https://example.com/cert/sv001-jp",  
 "ghiChu": ""  
 }  
 ],  
 "monhoc": [  
 {  
 "mamon": "csdl",  
 "tenmon": "Cơ sở dữ liệu",  
 "diem": 8.5  
 },  
 {  
 "mamon": "laptrinh",  
 "tenmon": "Lập trình Cơ bản",  
 "diem": 7.0  
 }  
 ]  
}

# 3. QUY TẮC DỮ LIỆU & VALIDATION

* masv bắt buộc, duy nhất; tạo Unique Index trên masv.
* hoten, malop không được để trống.
* tuoi là số nguyên dương (> 0).
* phai dùng tập giá trị hợp lệ Nam/Nữ.
* ngoaingu và monhoc được phép rỗng [] khi tạo sinh viên.
* mỗi phần tử monhoc phải có mamon, tenmon và diem; diem nằm trong [0.0, 10.0].
* Không cho phép trùng mamon trong mảng monhoc của cùng một sinh viên; kiểm tra trước khi $push.
* Thông tin ngoại ngữ dùng các key thống nhất theo camelCase: tenNgoaiNgu, trinhDo, certLink, ghiChu.
* Không bắt buộc email, số điện thoại hoặc trạng thái sinh viên vì không nằm trong rubric; chỉ bổ sung nếu nhóm thực sự triển khai chức năng tương ứng.

# 4. KIẾN TRÚC ỨNG DỤNG WEB

Luồng xử lý chính:

Browser  
 ↓ HTTP/JSON  
ASP.NET Core Controller  
 ↓  
Service / BLL  
 ↓  
Repository / DAL  
 ↓  
MongoDB.Driver  
 ↓  
MongoDB Atlas

## 4.1. Cấu trúc project đề xuất

StudentManagement/  
├── Controllers/  
│ ├── StudentsController.cs  
│ └── DashboardController.cs  
├── Models/  
│ ├── Student.cs  
│ └── Subject.cs  
├── DTOs/  
│ ├── StudentCreateDto.cs  
│ ├── StudentUpdateDto.cs  
│ └── SubjectDto.cs  
├── Data/  
│ └── MongoDbContext.cs  
├── Repositories/  
│ ├── IStudentRepository.cs  
│ └── StudentRepository.cs  
├── Services/  
│ ├── IStudentService.cs  
│ └── StudentService.cs  
├── Aggregations/  
│ └── DashboardRepository.cs  
├── Validators/  
│ └── StudentValidator.cs  
├── wwwroot/  
│ ├── css/  
│ └── js/  
├── appsettings.json  
└── Program.cs

# 5. PHÂN CHIA GIAI ĐOẠN & TRỌNG SỐ

|  |  |  |  |
| --- | --- | --- | --- |
| **Phase** | **Mục tiêu** | **Đầu việc chính** | **Điểm** |
| 1 | Kiến trúc, kết nối & Index | ASP.NET Core; MongoDBContext; Singleton/tái sử dụng MongoClient; connection string; Unique Index masv; Compound Index {malop:1, hoten:1}; seed 20 SV | 2.0 (1.0 + 1.0) |
| 2 | DAL/Repository, CRUD & thao tác mảng | Model/DTO; insert; read; search/filter; update; delete; $push/$addToSet; positional $; replaceOne | 4.0 (2.5 + 1.5) |
| 3 | Web UI & Dynamic Form | Form sinh viên; dynamic ngoại ngữ/môn học; bảng dữ liệu; validation phía client; confirmation delete | 2.0 |
| 4 | Dashboard & Aggregation | 4 KPI; thống kê lớp; ngoại ngữ; Top 5; phân loại học lực | 2.0 |
| 5 | Kiểm thử, hoàn thiện & demo | Exception; test cases; README; deployment; slide/kịch bản vấn đáp | Công việc hỗ trợ |

# 6. API ENDPOINTS DỰ KIẾN

|  |  |  |
| --- | --- | --- |
| **Method** | **Endpoint** | **Chức năng** |
| GET | /api/students | Lấy toàn bộ sinh viên |
| GET | /api/students/{masv} | Tìm chính xác theo mã SV |
| GET | /api/students?malop=... | Lọc theo mã lớp |
| POST | /api/students | Thêm sinh viên |
| PUT | /api/students/{masv} | Cập nhật thông tin cơ bản |
| DELETE | /api/students/{masv} | Xóa một sinh viên |
| DELETE | /api/students/class/{malop} | Xóa toàn bộ sinh viên theo lớp |
| POST | /api/students/{masv}/languages | Thêm ngoại ngữ |
| POST | /api/students/{masv}/subjects | Thêm môn học |
| PATCH | /api/students/{masv}/subjects/{mamon}/score | Cập nhật điểm môn |
| PUT | /api/students/{id}/replace | Thay thế toàn bộ document theo \_id |
| GET | /api/dashboard/summary | KPI tổng quan |
| GET | /api/dashboard/classes | Thống kê theo lớp |
| GET | /api/dashboard/languages | Thống kê ngoại ngữ |
| GET | /api/dashboard/top5 | Top 5 sinh viên |
| GET | /api/dashboard/academic-levels | Phân loại học lực |

# 7. CRUD & THAO TÁC MẢNG

* Create: InsertOneAsync với Student document; cho phép ngoaingu/monhoc là [].
* Read: FindAsync toàn bộ; tìm chính xác masv; lọc malop.
* Update cơ bản: UpdateOneAsync + $set cho hoten, tuoi, phai, malop.
* Delete: DeleteOneAsync theo masv; DeleteManyAsync theo malop.
* Thêm ngoại ngữ: $push; nếu cần chống trùng có thể dùng $addToSet nhưng phải xác định tiêu chí trùng phù hợp.
* Thêm môn học: kiểm tra mamon đã tồn tại trong monhoc của sinh viên; nếu chưa thì $push.
* Cập nhật điểm: filter theo masv và monhoc.mamon, update bằng positional operator monhoc.$.diem.
* Replace Document: ReplaceOneAsync theo \_id, thay thế toàn bộ document.

# 8. DASHBOARD & AGGREGATION

## 8.1. Bốn KPI

* Tổng số sinh viên hiện có.
* Tổng số lớp khác nhau.
* Điểm trung bình toàn trường: $unwind monhoc → lấy toàn bộ diem → $avg; không lấy trung bình đơn giản của điểm TB từng sinh viên.
* Tỷ lệ phần trăm Nam/Nữ.

## 8.2. Thống kê theo lớp

Tính điểm trung bình từng sinh viên từ monhoc.diem; sau đó group theo malop để lấy sĩ số, điểm TB cao nhất và thấp nhất của sinh viên trong lớp.

## 8.3. Phổ biến ngoại ngữ

$unwind "$ngoaingu"  
→ $group theo "$ngoaingu.tenNgoaiNgu"  
→ $sum: 1  
→ $sort giảm dần

## 8.4. Top 5

Tính điểm trung bình từng sinh viên → sort giảm dần → limit 5.

## 8.5. Phân loại học lực

* Xuất sắc: >= 8.5
* Giỏi: >= 7.0 và < 8.5
* Khá: >= 5.5 và < 7.0
* Trung bình/Yếu: < 5.5

Phân loại dựa trên điểm trung bình của từng sinh viên; dùng $cond hoặc $switch.

# 9. INDEX

* Unique Index: { masv: 1 }, unique = true.
* Compound Index: { malop: 1, hoten: 1 }.
* Tạo index tự động khi ứng dụng khởi động.
* Đặt tên index rõ ràng, ví dụ UX\_Student\_MaSV và IX\_Student\_MaLop\_HoTen.

# 10. GIAO DIỆN WEB

* Trang Dashboard: KPI cards, thống kê lớp, ngoại ngữ, Top 5, học lực.
* Trang Sinh viên: form nhập mã SV, họ tên, tuổi, phái, năm học, khoa, mã lớp.
* Dynamic Ngoại ngữ: nút [+] thêm dòng; nhập tên, trình độ, certLink, ghi chú.
* Dynamic Môn học: nút [+] thêm dòng; nhập mã môn, tên môn, điểm.
* Bảng danh sách: masv, hoten, phai, namhoc, khoa, malop, số ngoại ngữ, số môn, điểm TB.
* Tìm kiếm chính xác theo masv và lọc theo malop.
* Nút sửa/xóa; xác nhận trước khi xóa.
* Thông báo thành công/thất bại từ API; không để lỗi backend làm crash giao diện.

# 11. XỬ LÝ NGOẠI LỆ

* Bắt MongoWriteException khi vi phạm Unique Index; kiểm tra mã lỗi 11000 và trả thông báo thân thiện.
* HTTP 400 cho dữ liệu đầu vào không hợp lệ.
* HTTP 404 khi không tìm thấy sinh viên/môn học.
* HTTP 409 cho xung đột dữ liệu như masv hoặc mamon bị trùng.
* Không trả connection string hoặc thông tin nhạy cảm trong response.

# 12. TESTING CHECKLIST

|  |  |  |
| --- | --- | --- |
| **STT** | **Test case** | **Kết quả mong đợi** |
| 1 | Thêm SV với ngoaingu=[] và monhoc=[] | Insert thành công |
| 2 | Thêm SV trùng masv | HTTP 409/thông báo duplicate, app không crash |
| 3 | Điểm <0 hoặc >10 | Validation thất bại |
| 4 | Tuổi <=0 | Validation thất bại |
| 5 | Tìm masv tồn tại/không tồn tại | Trả đúng dữ liệu/404 |
| 6 | Lọc theo malop | Chỉ trả SV thuộc lớp |
| 7 | Thêm ngoại ngữ bằng $push | Mảng được bổ sung |
| 8 | Thêm môn học trùng mamon | Từ chối |
| 9 | Cập nhật điểm bằng positional $ | Đúng môn được cập nhật |
| 10 | replaceOne theo \_id | Document được thay thế |
| 11 | Xóa SV / xóa theo lớp | Đúng số lượng document bị xóa |
| 12 | Cập nhật điểm → Dashboard | KPI/Top 5 phản ánh dữ liệu mới |

# 13. KỊCH BẢN DEMO VẤN ĐÁP

* Giới thiệu kiến trúc Browser → ASP.NET Core → Service → Repository → MongoDB.Driver → Atlas.
* Chỉ ra appsettings.json và cách cấu hình connection string.
* Chỉ ra MongoDbContext và cơ chế tái sử dụng MongoClient.
* Mở MongoDB Compass để chứng minh database/collection/index.
* Thêm một sinh viên với hai mảng rỗng.
* Thêm ngoại ngữ và môn học động.
* Cập nhật điểm môn bằng positional operator.
* Thay đổi dữ liệu → mở Dashboard kiểm tra KPI và Top 5.
* Nhập masv đã tồn tại để chứng minh xử lý lỗi 11000.
* Thực hiện xóa và chứng minh confirmation dialog.
* Giải thích vì sao dùng embedded document thay vì tách collection trong phạm vi bài.

# 14. DEPLOYMENT

* MongoDB: tạo cluster trên MongoDB Atlas, tạo database qlsinhvien\_db và collection sinhvien; cấu hình Network Access/Database Access phù hợp.
* Backend: publish ASP.NET Core và triển khai lên một nền tảng hỗ trợ ASP.NET Core; cấu hình connection string bằng environment variable hoặc secret.
* Frontend: có thể phục vụ từ wwwroot của ASP.NET Core để tạo một ứng dụng web thống nhất.
* MongoDB Compass: dùng để kiểm tra document, index và kết quả thao tác; không phải thành phần runtime của web.
* Kiểm tra production: connection, CRUD, aggregation, CORS nếu frontend/backend tách riêng, và xử lý lỗi.

# 15. DELIVERABLES

* Source code GitHub/GitLab với cấu trúc phân lớp rõ ràng.
* README.md: yêu cầu môi trường, cài MongoDB.Driver, cấu hình Atlas, chạy project, seed data và deploy.
* appsettings mẫu không chứa secret thật; connection string production dùng environment variable/secret.
* data\_seed.json hoặc data\_seed.js với tối thiểu 20 sinh viên, nhiều lớp, nhiều môn và nhiều ngoại ngữ.
* Ảnh chụp hoặc video demo các chức năng chính.
* Slide/kịch bản vấn đáp.
* Link ứng dụng online nếu triển khai thành công.

# 16. MỐC HOÀN THÀNH

|  |  |
| --- | --- |
| **Mốc** | **Kết quả cần đạt** |
| M1 | Project ASP.NET Core chạy; kết nối Atlas thành công; Compass kiểm tra DB. |
| M2 | Model/DTO/Repository/Service hoàn thành; CRUD chạy qua API. |
| M3 | Web UI và dynamic form hoàn thành. |
| M4 | Array operations + replaceOne + validation hoàn thành. |
| M5 | Dashboard Aggregation hoàn thành và đối chiếu số liệu bằng Compass. |
| M6 | Index + testing + seed + README. |
| M7 | Deploy online, chạy toàn bộ demo và chuẩn bị vấn đáp. |

# 17. TIÊU CHÍ HOÀN THÀNH CUỐI CÙNG

Ứng dụng được xem là hoàn thành khi đáp ứng đầy đủ rubric của đề: kết nối/kiến trúc 1.0 điểm; giao diện và dynamic form 2.0 điểm; CRUD 2.5 điểm; thao tác mảng và replace document 1.5 điểm; Dashboard Aggregation 2.0 điểm; Index 1.0 điểm. Tổng 10 điểm. Các nội dung validation, testing, README và deployment là lớp hoàn thiện giúp chứng minh chất lượng và phục vụ demo.

Ghi chú: MongoDB Compass được sử dụng như công cụ quản trị/kiểm tra dữ liệu; ứng dụng web bắt buộc thực hiện thao tác MongoDB thông qua MongoDB.Driver theo yêu cầu của đề.