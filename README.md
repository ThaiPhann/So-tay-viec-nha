# Sổ tay việc nhà — bản demo tĩnh (GitHub Pages)

Thư mục này là **bản demo giao diện**, tự chứa, không cần máy chủ và không cần Internet.
Dữ liệu được lưu bằng `localStorage` **trên từng trình duyệt** — mỗi máy một danh sách riêng,
không dùng chung giữa các thành viên.

> Đây **không phải** app thật. App thật nằm ở thư mục cha, chạy bằng `server.js` + `bat-chay.bat`,
> dữ liệu dùng chung nằm trong `du-lieu.json`.

## Chạy thử

- Bấm đúp `index.html` (mở bằng `file://`), hoặc
- Chạy một máy chủ tĩnh bất kỳ, ví dụ:

```powershell
cd pages-demo
python -m http.server 8000
# mở http://localhost:8000
```

Đăng nhập: chọn một tên, nhập mã demo **`1234`**.
Đổi mã được trong **Cài đặt → Đổi mã gia đình** (chỉ đổi trên trình duyệt đó).

## File

| File | Vai trò |
|---|---|
| `index.html` | Toàn bộ giao diện (bản sao của app thật, chỉ thêm 1 thẻ script) |
| `demo-api.js` | Giả lập `/api/...` bằng `localStorage`, thêm băng báo "bản demo" |
| `.nojekyll` | Tắt xử lý Jekyll của GitHub Pages |

Không có `server.js`, `du-lieu.json`, `phien.json`, `ma-gia-dinh.txt` — cố ý.

## Đưa lên GitHub Pages

1. Tạo repo mới trên GitHub, chọn **Public** (GitHub Free bắt buộc public để dùng Pages).
2. Trong thư mục `pages-demo`, chạy:

   ```powershell
   git init
   # Nếu máy chưa cấu hình tên (git báo "Please tell me who you are"):
   git config user.name "Tên của bạn"
   git config user.email "email-cua-ban@example.com"
   git add .
   git commit -m "Ban demo tinh"
   git branch -M main
   git remote add origin https://github.com/<tên-tài-khoản>/<tên-repo>.git
   git push -u origin main
   ```

3. Vào repo → **Settings** → **Pages**.
4. **Source**: **Deploy from a branch** → **Branch**: `main`, **Folder**: `/ (root)` → **Save**.
5. Chờ 1–10 phút, mở `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

Kiểm tra trước khi push: `git ls-files` chỉ được có `index.html`, `demo-api.js`, `.nojekyll`, `README.md`.

## Giới hạn của bản demo

- Không có dữ liệu chung: mỗi máy/mỗi trình duyệt là một danh sách riêng.
- Không có đăng nhập thật: mã chỉ là chuỗi so sánh trong trình duyệt, ai mở DevTools cũng sửa được.
- Xoá dữ liệu trình duyệt là mất danh sách.
- Không dùng để lưu việc thật của gia đình.
