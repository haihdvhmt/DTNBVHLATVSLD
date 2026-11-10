# Phần mềm Quản lý Đào tạo An toàn Lao động

Hệ thống quản lý đào tạo, huấn luyện và thi cử an toàn lao động, xây dựng trên nền tảng NocoBase.

## Thông tin kỹ thuật

| Thành phần | Chi tiết |
|---|---|
| **Nền tảng** | NocoBase 2.3.0-beta.9 |
| **Runtime** | Node.js >= 18 |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Deploy** | Docker Compose |

## Cài đặt

### Yêu cầu
- Docker & Docker Compose
- Tối thiểu 2GB RAM, 10GB disk

### Các bước

1. Clone repository:
```bash
git clone https://github.com/haihdvhmt/DTNBVHLATVSLD.git
cd DTNBVHLATVSLD
```

2. Tạo file `.env` từ template:
```bash
cp .env.example .env
# Chỉnh sửa .env: thay đổi APP_KEY, ENCRYPTION_FIELD_KEY, DB_PASSWORD
```

3. Khởi chạy:
```bash
docker compose up -d
```

4. Truy cập: `http://localhost:13006`

## Cấu trúc dự án

```
├── docker-compose.yml    # Cấu hình Docker Compose
├── .env.example          # Template biến môi trường
├── package.json          # Dependencies (NocoBase 2.3.0-beta.9)
├── packages/
│   └── plugins/          # Custom plugins
└── storage/              # Runtime data (không commit)
```

## Phát triển Plugin

Custom plugins được đặt trong `packages/plugins/`. Xem [NocoBase Plugin Development](https://docs.nocobase.com/development) để biết thêm.
