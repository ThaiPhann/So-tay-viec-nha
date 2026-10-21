/* =========================================================
   BẢN DEMO TĨNH — giả lập API của server.js bằng localStorage
   ---------------------------------------------------------
   Dùng cho GitHub Pages: không có máy chủ, không có dữ liệu chung.
   Mỗi trình duyệt giữ một danh sách riêng. Đây chỉ là bản demo
   giao diện, KHÔNG dùng để thay thế app thật trong thư mục cha.

   Cách hoạt động: chặn window.fetch cho các đường dẫn /api/...
   và trả lời bằng dữ liệu trong localStorage, đúng hình dạng
   JSON mà server.js trả về.
   ========================================================= */
(function () {
  "use strict";

  var KHOA_DU_LIEU = "so-tay-viec-nha-demo-v1";
  var MA_DEMO = "1234";
  var TEN_GIA_DINH = "Nhà mình (demo)";
  var HAN_PHIEN_MS = 90 * 24 * 60 * 60 * 1000;

  /* ---------- Tiện ích ngày tháng (giống server.js) ---------- */

  function dinhDang(d) {
    var m = String(d.getMonth() + 1);
    var ng = String(d.getDate());
    return d.getFullYear() + "-" + (m.length < 2 ? "0" + m : m) + "-" + (ng.length < 2 ? "0" + ng : ng);
  }

  function ngaySau(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return dinhDang(d);
  }

  function viecMau() {
    return [
      { id: "mau-1", ten: "Rửa bát",      nguoi: "Mẹ",    han: dinhDang(new Date()), xong: false, taoLuc: Date.now(), xongLuc: null, xongBy: "" },
      { id: "mau-2", ten: "Quét sàn nhà", nguoi: "Bố",    han: ngaySau(1),           xong: false, taoLuc: Date.now(), xongLuc: null, xongBy: "" },
      { id: "mau-3", ten: "Đi chợ",       nguoi: "Con 1", han: ngaySau(3),           xong: false, taoLuc: Date.now(), xongLuc: null, xongBy: "" }
    ];
  }

  function taoDuLieuMoi() {
    return {
      xacBan: 1,
      tenGiaDinh: TEN_GIA_DINH,
      maGiaDinh: MA_DEMO,
      thanhVien: ["Bố", "Mẹ", "Con 1", "Con 2"],
      viec: viecMau(),
      phien: null,
      ngayTao: Date.now()
    };
  }

  function chuanHoaViec(v, i) {
    var ngay = /^\d{4}-\d{2}-\d{2}$/.test(String((v && v.han) || "")) ? String(v.han) : "";
    return {
      id: String((v && v.id) || ("v" + i + "-" + Date.now())),
      ten: String((v && v.ten) || "Việc không tên").slice(0, 200),
      nguoi: String((v && v.nguoi) || "").slice(0, 60),
      han: ngay,
      xong: !!(v && v.xong),
      taoLuc: Number(v && v.taoLuc) || Date.now(),
      xongLuc: v && v.xongLuc ? Number(v.xongLuc) : null,
      xongBy: String((v && v.xongBy) || "").slice(0, 60)
    };
  }

  function chuanHoa(dl) {
    if (!dl || typeof dl !== "object") dl = taoDuLieuMoi();
    if (!Array.isArray(dl.thanhVien) || dl.thanhVien.length === 0) {
      dl.thanhVien = ["Bố", "Mẹ", "Con 1", "Con 2"];
    }
    if (!Array.isArray(dl.viec)) dl.viec = [];
    dl.viec = dl.viec.map(chuanHoaViec);
    if (typeof dl.maGiaDinh !== "string" || dl.maGiaDinh.length < 4) dl.maGiaDinh = MA_DEMO;
    if (!dl.phien || typeof dl.phien !== "object") dl.phien = null;
    if (!dl.tenGiaDinh) dl.tenGiaDinh = TEN_GIA_DINH;
    return dl;
  }

  /* ---------- Đọc / ghi "cơ sở dữ liệu" trong localStorage ---------- */

  // Giữ thêm một bản trong RAM: trình duyệt chặn localStorage (chế độ riêng tư)
  // thì demo vẫn dùng được trong phiên đang mở.
  var duLieuTam = null;

  function docDuLieu() {
    var dl = null;
    try {
      var s = localStorage.getItem(KHOA_DU_LIEU);
      if (s) dl = JSON.parse(s);
    } catch (e) {
      dl = null;
    }
    if (!dl) dl = duLieuTam;
    dl = chuanHoa(dl);
    duLieuTam = dl;
    return dl;
  }

  function ghiDuLieu(dl) {
    duLieuTam = dl;
    try {
      localStorage.setItem(KHOA_DU_LIEU, JSON.stringify(dl));
    } catch (e) {
      /* Trình duyệt chặn localStorage: giữ tạm trong RAM. */
    }
  }

  function layPhien(dl) {
    if (!dl.phien) return null;
    if (Number(dl.phien.hetLuc) < Date.now()) {
      dl.phien = null;
      ghiDuLieu(dl);
      return null;
    }
    return dl.phien;
  }

  /* ---------- Trả lời giống server.js ---------- */

  function traJSON(ma, duLieu) {
    return new Response(JSON.stringify(duLieu), {
      status: ma,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }

  function docThan(opt) {
    try {
      if (!opt || !opt.body) return {};
      if (typeof opt.body === "string") return JSON.parse(opt.body) || {};
      return opt.body || {};
    } catch (e) {
      return {};
    }
  }

  function coNguoiHopLe(dl, nguoi) {
    if (dl.thanhVien.indexOf(nguoi) !== -1) return true;
    return dl.viec.some(function (v) { return v.nguoi === nguoi; });
  }

  function giaiMa(chuoi) {
    try { return decodeURIComponent(chuoi); } catch (e) { return chuoi; }
  }

  /* ---------- Bộ định tuyến /api/... ---------- */

  async function xuLyApi(duong, opt) {
    var method = String((opt && opt.method) || "GET").toUpperCase();
    var dl = docDuLieu();
    var body = docThan(opt);

    /* Khởi động: ai đang đăng nhập, trong nhà có ai */
    if (duong === "/api/khoi-dong" && method === "GET") {
      var phien = layPhien(dl);
      return traJSON(200, {
        tenGiaDinh: dl.tenGiaDinh,
        thanhVien: dl.thanhVien,
        daDongNhap: !!phien,
        ten: phien ? phien.ten : ""
      });
    }

    /* Đăng nhập */
    if (duong === "/api/dang-nhap" && method === "POST") {
      var ten = String(body.ten || "").trim();
      var khoa = String(body.khoa || "");
      if (!ten) return traJSON(400, { loi: "Bạn chưa chọn tên." });
      if (dl.thanhVien.indexOf(ten) === -1) {
        return traJSON(400, { loi: 'Tên "' + ten + '" không có trong danh sách thành viên.' });
      }
      if (!khoa) return traJSON(400, { loi: "Bạn chưa nhập mã gia đình." });
      if (khoa !== dl.maGiaDinh) {
        return traJSON(401, { loi: "Mã gia đình không đúng." });
      }
      dl.phien = { ten: ten, hetLuc: Date.now() + HAN_PHIEN_MS };
      ghiDuLieu(dl);
      return traJSON(200, { ok: true, ten: ten });
    }

    /* Đăng xuất */
    if (duong === "/api/dang-xuat" && method === "POST") {
      dl.phien = null;
      ghiDuLieu(dl);
      return traJSON(200, { ok: true });
    }

    /* Đổi mã gia đình */
    if (duong === "/api/doi-ma-gia-dinh" && method === "POST") {
      var phienDoiMa = layPhien(dl);
      if (!phienDoiMa) return traJSON(401, { loi: "Chưa đăng nhập." });
      if (String(body.maCu || "") !== dl.maGiaDinh) {
        return traJSON(401, { loi: "Mã cũ không đúng." });
      }
      var maMoi = String(body.maMoi || "").trim();
      if (maMoi.length < 4) return traJSON(400, { loi: "Mã mới phải có ít nhất 4 ký tự." });
      dl.maGiaDinh = maMoi;
      ghiDuLieu(dl);
      return traJSON(200, { ok: true });
    }

    /* Thành viên trong nhà */
    if (duong === "/api/thanh-vien" && method === "POST") {
      if (!layPhien(dl)) return traJSON(401, { loi: "Chưa đăng nhập." });
      var tenMoi = String(body.ten || "").trim().slice(0, 60);
      if (!tenMoi) return traJSON(400, { loi: "Tên trống." });
      if (dl.thanhVien.indexOf(tenMoi) === -1) {
        dl.thanhVien.push(tenMoi);
        ghiDuLieu(dl);
      }
      return traJSON(200, { ok: true, thanhVien: dl.thanhVien });
    }

    var xoaThanhVien = duong.match(/^\/api\/thanh-vien\/(.+)$/);
    if (xoaThanhVien && method === "DELETE") {
      var phienXoa = layPhien(dl);
      if (!phienXoa) return traJSON(401, { loi: "Chưa đăng nhập." });
      var tenXoa = giaiMa(xoaThanhVien[1]);
      if (tenXoa === phienXoa.ten) {
        return traJSON(400, { loi: "Không thể xoá chính người đang đăng nhập." });
      }
      dl.thanhVien = dl.thanhVien.filter(function (t) { return t !== tenXoa; });
      ghiDuLieu(dl);
      return traJSON(200, { ok: true, thanhVien: dl.thanhVien });
    }

    /* Danh sách việc */
    if (duong === "/api/viec" && method === "GET") {
      if (!layPhien(dl)) return traJSON(401, { loi: "Chưa đăng nhập." });
      return traJSON(200, { viec: dl.viec });
    }

    if (duong === "/api/viec" && method === "POST") {
      if (!layPhien(dl)) return traJSON(401, { loi: "Chưa đăng nhập." });
      var tenViec = String(body.ten || "").trim().slice(0, 200);
      if (!tenViec) return traJSON(400, { loi: "Tên việc trống." });
      var nguoi = String(body.nguoi || "").slice(0, 60);
      if (nguoi && !coNguoiHopLe(dl, nguoi)) {
        return traJSON(400, { loi: "Người làm phải là thành viên trong nhà." });
      }
      var han = /^\d{4}-\d{2}-\d{2}$/.test(String(body.han || "")) ? String(body.han) : "";
      var moi = {
        id: "v" + Date.now() + "-" + Math.random().toString(16).slice(2, 8),
        ten: tenViec,
        nguoi: nguoi,
        han: han,
        xong: false,
        taoLuc: Date.now(),
        xongLuc: null,
        xongBy: ""
      };
      dl.viec.push(moi);
      ghiDuLieu(dl);
      return traJSON(200, { ok: true, viec: moi });
    }

    var suaViec = duong.match(/^\/api\/viec\/(.+)$/);
    if (suaViec && (method === "PATCH" || method === "PUT")) {
      var phienSua = layPhien(dl);
      if (!phienSua) return traJSON(401, { loi: "Chưa đăng nhập." });
      var id = giaiMa(suaViec[1]);
      var v = null;
      for (var i = 0; i < dl.viec.length; i++) {
        if (dl.viec[i].id === id) { v = dl.viec[i]; break; }
      }
      if (!v) return traJSON(404, { loi: "Không tìm thấy việc này." });

      if (typeof body.ten === "string" && body.ten.trim()) v.ten = body.ten.trim().slice(0, 200);
      if (typeof body.nguoi === "string") {
        var nguoiSua = body.nguoi.slice(0, 60);
        if (nguoiSua && !coNguoiHopLe(dl, nguoiSua)) {
          return traJSON(400, { loi: "Người làm phải là thành viên trong nhà." });
        }
        v.nguoi = nguoiSua;
      }
      if (typeof body.han === "string") {
        v.han = /^\d{4}-\d{2}-\d{2}$/.test(body.han) ? body.han : "";
      }
      if (typeof body.xong === "boolean") {
        v.xong = body.xong;
        v.xongLuc = body.xong ? Date.now() : null;
        v.xongBy = body.xong ? phienSua.ten : "";
      }
      ghiDuLieu(dl);
      return traJSON(200, { ok: true, viec: v });
    }

    if (suaViec && method === "DELETE") {
      if (!layPhien(dl)) return traJSON(401, { loi: "Chưa đăng nhập." });
      var idXoa = giaiMa(suaViec[1]);
      var truoc = dl.viec.length;
      dl.viec = dl.viec.filter(function (x) { return x.id !== idXoa; });
      if (dl.viec.length === truoc) return traJSON(404, { loi: "Không tìm thấy việc này." });
      ghiDuLieu(dl);
      return traJSON(200, { ok: true });
    }

    /* Khôi phục 3 việc mẫu */
    if (duong === "/api/khoi-phuc-mau" && method === "POST") {
      if (!layPhien(dl)) return traJSON(401, { loi: "Chưa đăng nhập." });
      dl.viec = viecMau();
      ghiDuLieu(dl);
      return traJSON(200, { ok: true, viec: dl.viec });
    }

    return traJSON(404, { loi: "Không có API này." });
  }

  /* ---------- Chặn fetch để app tưởng đang nói chuyện với máy chủ ---------- */

  var fetchGoc = window.fetch ? window.fetch.bind(window) : null;

  window.fetch = function (duong, opt) {
    var url = typeof duong === "string" ? duong : (duong && duong.url) || "";
    var path = url.split("?")[0];

    if (path.indexOf("/api/") === 0) {
      return xuLyApi(path, opt || {});
    }
    if (fetchGoc) return fetchGoc(duong, opt);
    return Promise.reject(new Error("Không tải được tài nguyên."));
  };

  /* ---------- Gắn băng báo "bản demo" và sửa chữ ở màn hình đăng nhập ---------- */

  function ganGiaoDienDemo() {
    if (document.getElementById("demoBar")) return;

    var css = document.createElement("style");
    css.textContent =
      ".demo-bar{position:sticky;top:0;z-index:9999;background:#fff8e6;color:#6b4e00;" +
      "border-bottom:1px solid #f0dca8;padding:8px 12px;text-align:center;" +
      "font-size:14px;line-height:1.45;font-family:inherit}" +
      ".demo-bar strong{color:#8a5a00}" +
      ".demo-bar code{background:#fff;border:1px solid #e6d6a8;border-radius:6px;" +
      "padding:1px 6px;font-size:13px}";
    document.head.appendChild(css);

    var thanh = document.createElement("div");
    thanh.className = "demo-bar";
    thanh.id = "demoBar";
    thanh.setAttribute("role", "note");
    thanh.innerHTML =
      "<strong>Bản demo tĩnh</strong> — dữ liệu chỉ lưu trên trình duyệt này, " +
      "không dùng chung giữa các máy. Mã demo: <code>1234</code>.";
    document.body.insertBefore(thanh, document.body.firstChild);

    var sub = document.getElementById("loginSub");
    if (sub) sub.textContent = "Bản demo: chọn tên và nhập mã 1234 để xem giao diện.";

    var khoa = document.getElementById("loginKhoa");
    if (khoa) khoa.placeholder = "Mã demo: 1234";

    var hint = document.querySelector(".login-card .hint");
    if (hint) {
      hint.innerHTML =
        "Đây là bản demo chạy hoàn toàn trên trình duyệt, không cần máy chủ. " +
        "Muốn cả nhà dùng chung một danh sách thì dùng bản đầy đủ trong thư mục cha " +
        "(chạy <code>bat-chay.bat</code>).";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ganGiaoDienDemo);
  } else {
    ganGiaoDienDemo();
  }
})();
