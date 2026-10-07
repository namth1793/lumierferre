require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const kiotviet = require('./kiotviet');
const cloudinaryStore = require('./cloudinary');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT || 5033;

// Trên Railway, gắn Volume rồi set Mount Path trùng với biến DATA_DIR bên dưới
// (vd: cả hai đều là /data) để DB không mất khi redeploy.
const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'lumierferre.db'));
console.log(`✦ Database: ${path.join(dataDir, 'lumierferre.db')}`);
if (process.env.RAILWAY_ENVIRONMENT && !process.env.RAILWAY_VOLUME_MOUNT_PATH) {
  console.warn('⚠ Railway chưa gắn Volume → mọi dữ liệu admin sẽ MẤT sau mỗi lần deploy lại!');
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Dữ liệu admin vừa sửa phải hiện ngay → không cho trình duyệt/proxy giữ bản cũ của API
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// Nội dung admin chỉ lưu dạng text thuần: bỏ mọi thẻ HTML trước khi ghi vào DB
function toPlainText(value) {
  if (Array.isArray(value)) return value.map(toPlainText);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlainText(v)]));
  }
  if (typeof value !== 'string') return value;
  // Dán nguyên mã nhúng Google Maps → chỉ giữ lại link
  const iframeSrc = value.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i);
  if (iframeSrc) return iframeSrc[1];
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ').replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&amp;/gi, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

app.use('/api/admin', (req, _res, next) => {
  if (['POST', 'PUT'].includes(req.method) && req.path !== '/login' && req.body && typeof req.body === 'object') {
    req.body = toPlainText(req.body);
  }
  next();
});

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    season TEXT,
    description TEXT,
    cover_image TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    price INTEGER NOT NULL,
    original_price INTEGER,
    category_id INTEGER,
    collection_id INTEGER,
    description TEXT,
    fabric TEXT,
    care TEXT,
    sizes TEXT DEFAULT '["XS","S","M","L","XL","XXL"]',
    colors TEXT DEFAULT '["Đen","Trắng","Kem"]',
    images TEXT DEFAULT '[]',
    is_featured INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    is_bridal INTEGER DEFAULT 0,
    is_soldout INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (collection_id) REFERENCES collections(id)
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    items TEXT NOT NULL DEFAULT '[]',
    subtotal REAL DEFAULT 0,
    shipping REAL DEFAULT 0,
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'bank_transfer',
    payment_status TEXT DEFAULT 'unpaid',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kiotviet_customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kiotviet_id INTEGER UNIQUE,
    code TEXT,
    name TEXT,
    contact_number TEXT,
    email TEXT,
    address TEXT,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrate: thêm cột liên kết KiotViet cho các bảng đã tồn tại từ trước
function ensureColumn(table, column, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
}
ensureColumn('categories', 'kiotviet_id', 'INTEGER');
ensureColumn('categories', 'kiotviet_code', 'TEXT');
ensureColumn('categories', 'image', 'TEXT');
ensureColumn('products', 'kiotviet_id', 'INTEGER');
ensureColumn('products', 'kiotviet_code', 'TEXT');
ensureColumn('orders', 'kiotviet_order_id', 'INTEGER');
ensureColumn('orders', 'kiotviet_order_code', 'TEXT');
ensureColumn('orders', 'kiotviet_sync_status', "TEXT DEFAULT 'not_synced'");
ensureColumn('orders', 'kiotviet_sync_error', 'TEXT');

// Bản tiếng Anh do admin tự nhập (để trống → website EN hiển thị bản tiếng Việt)
const EN_COLUMNS = {
  categories: ['name', 'description'],
  collections: ['name', 'season', 'description'],
  products: ['name', 'description', 'fabric', 'care', 'colors'],
};
for (const [table, cols] of Object.entries(EN_COLUMNS)) {
  for (const c of cols) ensureColumn(table, `${c}_en`, c === 'colors' ? "TEXT DEFAULT '[]'" : "TEXT DEFAULT ''");
}

function slugify(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();
}

const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (catCount === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)');
  [
    ['Váy đầm', 'vay-dam', 'Váy đầm thời trang cao cấp', 1],
    ['Tops', 'tops', 'Áo sơ mi, áo blouse, áo tay ngắn', 2],
    ['Bottom', 'bottom', 'Chân váy, quần thời trang', 3],
    ['Outerwear', 'outerwear', 'Áo khoác, blazer, vest', 4],
    ['Cape', 'cape', 'Cape và áo choàng thời trang', 5],
    ['Jumpsuits', 'jumpsuits', 'Jumpsuit và romper', 6],
    ['Áo dài', 'ao-dai', 'Áo dài truyền thống và hiện đại', 7],
    ['Phụ kiện', 'phu-kien', 'Phụ kiện thời trang', 8],
  ].forEach(c => insertCat.run(...c));

  const insertCol = db.prepare('INSERT INTO collections (name, slug, season, description, cover_image) VALUES (?, ?, ?, ?, ?)');
  insertCol.run('Rêverie SS26', 'reverie-ss26', 'Spring Summer 2026',
    'Bộ sưu tập Xuân Hè 2026 — Những giấc mơ lãng mạn qua từng đường nét tinh tế.',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&h=900&fit=crop');
  insertCol.run('La Pureza FW26', 'la-pureza-fw25', 'Fall Winter 2026',
    'Bộ sưu tập Thu Đông 2026 — Sự tinh khiết thuần túy trong từng thớ vải cao cấp.',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1400&h=900&fit=crop');

  const insertProd = db.prepare(`
    INSERT INTO products
      (name, slug, price, original_price, category_id, collection_id,
       description, fabric, care, sizes, colors, images,
       is_featured, is_new, is_bridal, is_soldout)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const products = [
    [
      'Váy Almira', 'vay-almira', 13820000, null, 1, 1,
      'Váy Almira với thiết kế cổ điển hiện đại, được tạo nên từ lụa tơ tằm cao cấp với những nếp gấp tinh tế. Dáng váy ôm nhẹ tôn lên đường cong tự nhiên của người mặc.',
      'Lụa tơ tằm 100% (Mulberry silk)',
      'Giặt tay với nước lạnh. Không vắt mạnh. Ủi mặt trái ở nhiệt độ thấp.',
      '["XS","S","M","L","XL"]', '["Đen","Kem","Hồng nude"]',
      JSON.stringify(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&h=900&fit=crop']),
      1, 1, 0, 0
    ],
    [
      'Đầm Celestine Bridal', 'dam-celestine-bridal', 22500000, null, 1, 1,
      'Chiếc váy cô dâu Celestine toát lên vẻ đẹp thuần khiết với những chi tiết thêu tay tỉ mỉ trên nền voan mềm mại. Đường cắt may chính xác tôn lên vẻ nữ tính kiêu sa.',
      'Voan tơ Pháp & Ren Chantilly nhập khẩu',
      'Vệ sinh khô (Dry clean only). Bảo quản trong túi vải thoáng khí.',
      '["XS","S","M","L"]', '["Trắng","Ngà"]',
      JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=700&h=900&fit=crop']),
      1, 0, 1, 0
    ],
    [
      'Áo Sơ Mi Analia', 'ao-so-mi-analia', 8320000, null, 2, 2,
      'Áo sơ mi Analia thanh lịch với chất liệu mềm mại, phù hợp cho mọi dịp từ công sở đến dạo phố. Đường cắt rộng rãi mang lại sự thoải mái tuyệt đối.',
      'Lụa & Cotton hữu cơ (70/30)',
      'Giặt máy chế độ nhẹ, nước lạnh. Ủi ở nhiệt độ trung bình.',
      '["XS","S","M","L","XL","XXL"]', '["Trắng","Xanh nhạt","Kem"]',
      JSON.stringify(['https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700&h=900&fit=crop']),
      1, 0, 0, 0
    ],
    [
      'Váy Dài Mystique Maxi', 'vay-dai-mystique-maxi', 15200000, null, 1, 1,
      'Váy maxi Mystique với đường cắt may chính xác và chất organza cao cấp tạo nên những lớp sóng nhẹ nhàng. Vẻ đẹp huyền bí và cuốn hút trong từng bước đi.',
      'Organza lụa nhập khẩu cao cấp',
      'Giặt tay nhẹ nhàng. Phơi nơi thoáng mát tránh ánh nắng trực tiếp.',
      '["XS","S","M","L"]', '["Đen","Trắng","Xanh navy"]',
      JSON.stringify(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&h=900&fit=crop']),
      1, 0, 0, 0
    ],
    [
      'Jumpsuit Élégance', 'jumpsuit-elegance', 11500000, null, 6, 2,
      'Jumpsuit Élégance kết hợp hoàn hảo giữa sự thoải mái và phong cách, lý tưởng cho buổi tiệc hoặc sự kiện quan trọng. Thiết kế một mảnh tinh tế và hiện đại.',
      'Crepe de Chine & Satin cao cấp',
      'Giặt tay hoặc vệ sinh khô. Ủi mặt trái ở nhiệt độ thấp.',
      '["XS","S","M","L","XL"]', '["Đen","Đỏ đô","Xanh rêu"]',
      JSON.stringify(['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&h=900&fit=crop']),
      0, 1, 0, 0
    ],
    [
      'Cape Romantique Sheer', 'cape-romantique-sheer', 16800000, null, 5, 1,
      'Cape trong suốt với những họa tiết thêu tinh xảo bằng tay, mang lại vẻ đẹp huyền bí và lãng mạn. Lớp phủ ngoài hoàn hảo cho mọi dịp đặc biệt.',
      'Voan trong suốt & Ren Pháp thêu tay',
      'Vệ sinh khô. Bảo quản treo trong tủ thoáng khí.',
      '["Freesize"]', '["Trắng","Hồng phấn","Đen"]',
      JSON.stringify(['https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=700&h=900&fit=crop']),
      1, 0, 0, 0
    ],
    [
      'Áo Dài Hiện Đại Lumière', 'ao-dai-hien-dai-lumiere', 18500000, null, 7, 1,
      'Áo dài Lumière tái hiện vẻ đẹp truyền thống qua lăng kính hiện đại. Đường cắt may tinh tế kết hợp chất liệu gấm lụa cao cấp tạo nên sự hoàn hảo trong từng chi tiết.',
      'Gấm lụa tơ tằm & Brocade thủ công',
      'Vệ sinh khô bắt buộc. Bảo quản trong túi chống bụi.',
      '["XS","S","M","L","XL"]', '["Đỏ","Vàng kim","Xanh ngọc","Tím"]',
      JSON.stringify(['https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=700&h=900&fit=crop']),
      1, 1, 0, 0
    ],
    [
      'Váy Mini Floral Beaded', 'vay-mini-floral-beaded', 13900000, null, 1, 1,
      'Váy mini với những hạt cườm đính tay tỉ mỉ theo họa tiết hoa 3D nổi bật. Sự kết hợp độc đáo giữa nghệ thuật thủ công và thiết kế hiện đại.',
      'Vải tulle cao cấp & Hạt pha lê Swarovski',
      'Vệ sinh khô bắt buộc. Không vắt, không sấy.',
      '["XS","S","M","L"]', '["Trắng","Hồng","Xanh biển"]',
      JSON.stringify(['https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop']),
      1, 0, 0, 0
    ],
    [
      'Top Crystal Embellished', 'top-crystal-embellished', 9200000, null, 2, 1,
      'Top đính đá pha lê sang trọng, thích hợp cho các buổi tiệc tối hoặc sự kiện đặc biệt. Ánh sáng lấp lánh từ đá pha lê tạo nên vẻ đẹp cuốn hút.',
      'Mesh cao cấp & Đá pha lê Swarovski đính tay',
      'Vệ sinh khô. Tránh tiếp xúc với nước và hóa chất.',
      '["XS","S","M","L"]', '["Đen","Bạc","Vàng"]',
      JSON.stringify(['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&h=900&fit=crop']),
      0, 0, 0, 0
    ],
    [
      '3D Floral Cardigan Skirt Set', '3d-floral-cardigan-skirt-set', 12500000, null, 3, 2,
      'Bộ cardigan và chân váy với họa tiết hoa 3D nổi, tạo điểm nhấn thời trang ấn tượng. Sự kết hợp tinh tế giữa chất liệu len cao cấp và kỹ thuật dệt đặc biệt.',
      'Len Merino & Tweed cao cấp nhập khẩu',
      'Giặt tay nước lạnh hoặc vệ sinh khô. Phơi nằm ngang.',
      '["XS","S","M","L","XL"]', '["Trắng","Kem","Hồng nhạt"]',
      JSON.stringify(['https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop']),
      0, 0, 0, 1
    ],
    [
      'Blazer Structured', 'blazer-structured', 14200000, null, 4, 2,
      'Blazer cấu trúc thanh lịch với đường cắt may chính xác, hoàn hảo cho phong cách công sở sang trọng. Thiết kế tailored kết hợp các chi tiết độc đáo tạo nên sự khác biệt.',
      'Wool blend cao cấp (Ý) & Lót lụa',
      'Vệ sinh khô. Bảo quản treo với móc áo có đệm vai.',
      '["XS","S","M","L","XL","XXL"]', '["Đen","Xám","Kem"]',
      JSON.stringify(['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1520367445093-50dc08a59d9d?w=700&h=900&fit=crop']),
      0, 0, 0, 0
    ],
    [
      'Váy Lace Organza Midi', 'vay-lace-organza-midi', 11800000, null, 1, 1,
      'Váy midi kết hợp ren và organza tạo nên vẻ đẹp nữ tính và tinh tế. Lớp ren được thêu thủ công với những họa tiết hoa tinh xảo.',
      'Ren Chantilly thủ công & Organza lụa',
      'Vệ sinh khô bắt buộc. Không tiếp xúc với vật sắc nhọn.',
      '["XS","S","M","L"]', '["Trắng","Đen","Caramel"]',
      JSON.stringify(['https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=900&fit=crop']),
      1, 0, 0, 0
    ],
    [
      'Váy Sequin Evening', 'vay-sequin-evening', 16500000, null, 1, 2,
      'Váy dạ hội đính sequin lấp lánh, trở thành tâm điểm của mọi buổi tiệc và sự kiện quan trọng. Mỗi sequin được đính thủ công tạo nên hiệu ứng ánh sáng độc đáo.',
      'Sequin thủ công & Lót lụa tơ tằm',
      'Vệ sinh khô bắt buộc. Bảo quản trong túi vải bảo vệ.',
      '["XS","S","M","L","XL"]', '["Vàng kim","Bạc","Đen"]',
      JSON.stringify(['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=700&h=900&fit=crop']),
      1, 0, 0, 0
    ],
    [
      'Áo Dài Cách Tân Bridal', 'ao-dai-cach-tan-bridal', 28000000, null, 7, 1,
      'Áo dài cô dâu cách tân kết hợp nét truyền thống với thiết kế hiện đại. Gấm tơ tằm kết hợp ren Ý tạo nên vẻ đẹp thuần túy và quý phái của người phụ nữ Việt.',
      'Gấm tơ tằm thượng hạng & Ren Ý nhập khẩu',
      'Vệ sinh khô chuyên nghiệp. Bảo quản trong bao vải trắng thoáng khí.',
      '["XS","S","M","L"]', '["Trắng","Ngà","Hồng phấn"]',
      JSON.stringify(['https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&h=900&fit=crop']),
      1, 1, 1, 0
    ],
    [
      'Chân Váy Xòe Tulle', 'chan-vay-xoe-tulle', 8900000, null, 3, 1,
      'Chân váy tulle xòe nhẹ nhàng, tạo nên vẻ đẹp công chúa thanh thoát và nữ tính. Nhiều lớp tulle mềm mại tạo độ phồng hoàn hảo.',
      'Tulle cao cấp & Taffeta lót trong',
      'Giặt tay nước lạnh. Phơi nằm ngang tránh biến dạng.',
      '["XS","S","M","L","XL"]', '["Trắng","Hồng","Đen","Lavender"]',
      JSON.stringify(['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=700&h=900&fit=crop']),
      0, 0, 0, 0
    ],
    [
      'Bodysuit Silk', 'bodysuit-silk', 7500000, null, 2, 2,
      'Bodysuit lụa mềm mại ôm sát đường cong, tạo nên vẻ đẹp quyến rũ và tinh tế. Thiết kế tối giản nhưng sang trọng, dễ dàng kết hợp với mọi trang phục.',
      'Lụa 100% Mulberry cao cấp',
      'Giặt tay nước lạnh. Không vắt. Phơi nơi thoáng mát.',
      '["XS","S","M","L","XL"]', '["Đen","Trắng","Kem","Be"]',
      JSON.stringify(['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=900&fit=crop']),
      0, 0, 0, 0
    ],
    [
      'Vest Tailored Oversized', 'vest-tailored-oversized', 13200000, null, 4, 2,
      'Vest tailored oversized với thiết kế hiện đại dễ kết hợp, mang đến phong cách menswear tinh tế và cá tính. Đường cắt may hoàn hảo từ chất liệu Cashmere blend.',
      'Wool & Cashmere blend 80/20 (Ý)',
      'Vệ sinh khô. Bảo quản treo tránh ánh nắng.',
      '["XS","S","M","L","XL"]', '["Be","Xám than","Trắng","Đen"]',
      JSON.stringify(['https://images.unsplash.com/photo-1520367445093-50dc08a59d9d?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop']),
      0, 1, 0, 0
    ],
    [
      'Phụ Kiện Cài Tóc Pearl', 'phu-kien-cai-toc-pearl', 2800000, null, 8, null,
      'Cài tóc đính ngọc trai tự nhiên thanh lịch, điểm tô hoàn hảo cho mọi kiểu tóc và trang phục. Mỗi viên ngọc trai được chọn lọc thủ công đảm bảo chất lượng cao nhất.',
      'Ngọc trai tự nhiên & Khung kim loại mạ vàng 18K',
      'Lau nhẹ bằng vải mềm. Tránh tiếp xúc nước và hóa chất.',
      '["Freesize"]', '["Vàng","Bạc"]',
      JSON.stringify(['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=700&h=900&fit=crop']),
      0, 0, 0, 0
    ],
    [
      'Jumpsuit Bridal Off-Shoulder', 'jumpsuit-bridal-off-shoulder', 19500000, null, 6, 1,
      'Jumpsuit cô dâu trễ vai sang trọng, mang đến vẻ đẹp hiện đại và độc đáo cho ngày cưới. Sự kết hợp giữa crepe lụa và ren Pháp tạo nên tổng thể hoàn chỉnh.',
      'Crepe lụa cao cấp & Ren Pháp thêu tay',
      'Vệ sinh khô chuyên nghiệp. Bảo quản trong bao vải trắng.',
      '["XS","S","M","L"]', '["Trắng","Ngà"]',
      JSON.stringify(['https://images.unsplash.com/photo-1619603364853-e79fca2c7b4d?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&h=900&fit=crop']),
      0, 1, 1, 0
    ],
    [
      'Váy Cocktail Metallic', 'vay-cocktail-metallic', 14800000, null, 1, 2,
      'Váy cocktail metallic với ánh sáng lấp lánh cuốn hút, trở thành tâm điểm của mọi không gian. Chất liệu lamé cao cấp phản chiếu ánh sáng tạo hiệu ứng ấn tượng.',
      'Lamé metallic & Satin lót trong',
      'Vệ sinh khô bắt buộc. Bảo quản trong túi vải tránh ma sát.',
      '["XS","S","M","L","XL"]', '["Vàng kim","Bạc","Đồng rose"]',
      JSON.stringify(['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&h=900&fit=crop']),
      1, 1, 0, 0
    ],
  ];

  products.forEach(p => insertProd.run(...p));
  console.log('Database seeded successfully.');
}

// ── Site settings (nội dung trang chủ/giới thiệu/liên hệ do admin chỉnh sửa) ──
const DEFAULT_SETTINGS = {
  general: {
    site_name: 'LUMIE FERRE',
    logo_url: '',
    announcement_text: 'MIỄN PHÍ VẬN CHUYỂN CHO ĐƠN HÀNG TỪ 5.000.000₫',
    footer_address_hn: '15 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    footer_address_hcm: '367 Nguyễn Đình Chiểu, Phường Bàn Cờ, TP. Hồ Chí Minh',
    footer_phone: '+84 28 3829 5678',
    footer_email: 'hello@lumierferre.com',
    footer_hours: '9:00 — 21:00 hàng ngày',
    facebook_url: 'https://www.facebook.com/people/LUMIE-FERRE/61591943820241/',
    instagram_handle: '@lumierferre',
    pinterest_handle: 'LUMIE FERRE',
  },
  home: {
    hero_slides: [
      { image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop&q=90', label: 'BỘ SƯU TẬP XUÂN HÈ 2026', title: 'Rêverie', subtitle: 'Những giấc mơ lãng mạn qua từng đường nét tinh tế', cta_text: 'Khám Phá Rêverie', cta_href: '/bo-suu-tap/reverie-ss26' },
      { image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1920&h=1080&fit=crop&q=90', label: 'BỘ SƯU TẬP THU ĐÔNG 2026', title: 'La Pureza', subtitle: 'Sự tinh khiết thuần túy trong từng thớ vải cao cấp', cta_text: 'Mua Sắm Ngay', cta_href: '/bo-suu-tap/la-pureza-fw25' },
    ],
    about_image: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=700&h=900&fit=crop&q=85',
    about_label: 'TRIẾT LÝ THƯƠNG HIỆU',
    about_title1: 'Giao thoa',
    about_title2: 'Đông Tây',
    about_desc1: 'LUMIE FERRE ra đời từ khát vọng kết hợp tinh hoa thời trang phương Tây với vẻ đẹp truyền thống phương Đông, tạo nên những thiết kế vượt thời gian.',
    about_desc2: 'Mỗi sản phẩm là một tác phẩm nghệ thuật, được chế tác thủ công tỉ mỉ bởi những nghệ nhân lành nghề với chất liệu cao cấp nhất.',
    quote_label: 'CHÂM NGÔN',
    quote_text: '"Thời trang là ngôn ngữ không lời, nói lên vẻ đẹp và cá tính của mỗi người phụ nữ."',
  },
  about: {
    hero_image: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=1920&h=1080&fit=crop&q=90',
    story_label: 'CÂU CHUYỆN THƯƠNG HIỆU',
    heading_line1: 'Nơi truyền thống',
    heading_line2: 'gặp gỡ hiện đại',
    story1: 'LUMIE FERRE được thành lập vào năm 2026 bởi Isabelle Ferré, với khát vọng tạo nên những thiết kế thời trang cao cấp giao thoa giữa vẻ đẹp phương Đông và phương Tây.',
    story2: 'Từ một xưởng may nhỏ tại Hà Nội, chúng tôi đã phát triển thành một thương hiệu thời trang được yêu thích, với những sản phẩm được chế tác thủ công tỉ mỉ bởi đội ngũ nghệ nhân lành nghề.',
    story3: 'Ngày nay, LUMIE FERRE tự hào mang đến những thiết kế vượt thời gian, kết hợp chất liệu cao cấp với kỹ thuật thủ công tinh xảo.',
    atelier_image1: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=400&h=500&fit=crop&q=85',
    atelier_image2: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=400&h=500&fit=crop&q=85',
    atelier_title1: 'Nghệ thuật thủ công',
    atelier_title2: 'trong từng đường kim mũi chỉ',
    atelier_desc1: 'Mỗi sản phẩm LUMIE FERRE đều được chế tác tại xưởng may riêng của chúng tôi, nơi các nghệ nhân dành hàng chục giờ để hoàn thiện từng chi tiết.',
    atelier_desc2: 'Chúng tôi tin rằng sự hoàn hảo đến từ sự tỉ mỉ, và mỗi đường may đều mang trong nó câu chuyện của người thợ tạo ra nó.',
    team: [
      { name: 'Isabelle Ferré', role: 'Nhà Sáng Lập & Giám Đốc Sáng Tạo', image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=500&h=600&fit=crop' },
      { name: 'Nguyễn Ánh Lumière', role: 'Giám Đốc Thiết Kế', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=600&fit=crop' },
      { name: 'Trần Minh Laurent', role: 'Giám Đốc Nghệ Thuật', image: 'https://images.unsplash.com/photo-1566479179817-c0a8b8dfafb8?w=500&h=600&fit=crop' },
    ],
    stats: [
      { num: '2026', label: 'Năm Thành Lập' },
      { num: '50+', label: 'Nghệ Nhân' },
      { num: '500+', label: 'Thiết Kế' },
      { num: '2', label: 'Showroom' },
    ],
  },
  contact: {
    showrooms: [
      { city: 'Hà Nội', address: '15 Tràng Tiền, Hoàn Kiếm, Hà Nội', phone: '+84 24 3825 6789', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.097148767688!2d105.8509!3d21.0245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDAxJzI4LjIiTiAxMDXCsDUxJzAzLjIiRQ!5e0!3m2!1svi!2svn!4v1234567890' },
      { city: 'TP. Hồ Chí Minh', address: '367 Nguyễn Đình Chiểu, Phường Bàn Cờ, TP. Hồ Chí Minh', phone: '+84 28 3829 5678', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4!2d106.7009!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzM2LjgiTiAxMDbCsDQyJzAzLjIiRQ!5e0!3m2!1svi!2svn!4v1234567890' },
    ],
    bespoke_title: 'Đặt May Riêng',
    bespoke_desc: 'Chúng tôi cung cấp dịch vụ tư vấn và đặt may riêng cho những dịp đặc biệt. Đặt lịch hẹn với đội ngũ thiết kế của chúng tôi.',
  },
};

const getSetting = db.prepare('SELECT value FROM site_settings WHERE key = ?');
const insertSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  if (!getSetting.get(key)) insertSetting.run(key, JSON.stringify(value));
}

// Đổi tên thương hiệu cũ trong cài đặt đã lưu (DB đã có sẵn trên Railway)
db.prepare(`
  UPDATE site_settings
  SET value = REPLACE(REPLACE(REPLACE(value, 'LUMIÈRE FERRÉ', 'LUMIE FERRE'), 'Lumière Ferré', 'LUMIE FERRE'), 'LUMIERE FERRE', 'LUMIE FERRE')
  WHERE value LIKE '%LUMIÈRE FERRÉ%' OR value LIKE '%Lumière Ferré%' OR value LIKE '%LUMIERE FERRE%'
`).run();

// Đổi các mốc năm cũ trong DB đã có sẵn (Railway) thành 2026 — slug bộ sưu tập giữ nguyên để không gãy link
for (const [from, to] of [
  ['FALL WINTER 2025', 'FALL WINTER 2026'], ['Fall Winter 2025', 'Fall Winter 2026'], ['FW25', 'FW26'],
  ['Thu Đông 2025', 'Thu Đông 2026'], ['THU ĐÔNG 2025', 'THU ĐÔNG 2026'],
  ['năm 2018', 'năm 2026'], ['"num":"2018"', '"num":"2026"'],
]) {
  db.prepare('UPDATE site_settings SET value = REPLACE(value, ?, ?) WHERE instr(value, ?) > 0').run(from, to, from);
  db.prepare(`UPDATE collections SET name = REPLACE(name, ?, ?), season = REPLACE(season, ?, ?), description = REPLACE(description, ?, ?)
    WHERE instr(name, ?) > 0 OR instr(season, ?) > 0 OR instr(description, ?) > 0`).run(from, to, from, to, from, to, from, from, from);
}

// Patch broken image URLs (runs every startup to fix existing DB)
db.prepare(`
  UPDATE products SET images = ? WHERE slug = 'vay-cocktail-metallic'
    AND images LIKE '%1594938298603%'
`).run(JSON.stringify([
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=900&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&h=900&fit=crop',
]));

// ── Song ngữ VI / EN ─────────────────────────────────────
const wantsEn = (req) => req.query.lang === 'en';
const parseList = (v) => {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v || '[]'); } catch { return []; }
};
const toList = (v) => Array.isArray(v) ? v : (v || '').split(',').map(s => s.trim()).filter(Boolean);

// Bản EN: lấy trường *_en nếu admin đã nhập, chưa nhập thì giữ tiếng Việt
function pickEn(row, cols) {
  const out = { ...row };
  for (const c of cols) if (typeof row[`${c}_en`] === 'string' && row[`${c}_en`].trim()) out[c] = row[`${c}_en`];
  return out;
}
const localizeCategory = (c) => pickEn(c, ['name', 'description']);
const localizeCollection = (c) => pickEn(c, ['name', 'season', 'description']);
function localizeProduct(p) {
  const out = pickEn(p, ['name', 'description', 'fabric', 'care', 'category_name', 'collection_name']);
  const colorsEn = parseList(p.colors_en);
  out.colors = (p.colors || []).map((c, i) => colorsEn[i] || c); // màu EN khớp theo thứ tự với màu VI
  return out;
}

// Nội dung trang (site_settings): bản EN nằm ngay cạnh bản VI với hậu tố _en (vd: quote_text_en,
// hero_slides[0].label_en) → thêm/xóa slide, thành viên... thì 2 bản luôn đi cùng nhau
function localizeSetting(value) {
  if (Array.isArray(value)) return value.map(localizeSetting);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) if (!k.endsWith('_en')) out[k] = localizeSetting(v);
  for (const [k, v] of Object.entries(value)) {
    if (k.endsWith('_en') && typeof v === 'string' && v.trim()) out[k.slice(0, -3)] = v;
  }
  return out;
}

// Điền sẵn bản EN cho nội dung mẫu: chỉ điền trường EN còn trống mà nội dung VI vẫn đúng như mẫu.
// Chạy đúng 1 lần cho mỗi DB (đánh dấu bằng PRAGMA user_version) → admin cố ý xóa trống bản EN thì không bị điền lại.
const SEED_EN = require('./seed-en');
const isAscii = (s) => /^[\x20-\x7E]+$/.test(s);
function seedSettingEn(value) {
  if (Array.isArray(value)) return value.map(seedSettingEn);
  if (!value || typeof value !== 'object') return value;
  const out = { ...value };
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') {
      if (!k.endsWith('_en') && !out[`${k}_en`] && SEED_EN[v]) out[`${k}_en`] = SEED_EN[v];
    } else if (v && typeof v === 'object') {
      out[k] = seedSettingEn(v);
    }
  }
  return out;
}
function seedEnglishContent() {
  for (const [table, cols] of Object.entries(EN_COLUMNS)) {
    for (const row of db.prepare(`SELECT * FROM ${table}`).all()) {
      const updates = {};
      for (const c of cols) {
        if (c === 'colors') {
          const vi = parseList(row.colors);
          if (!parseList(row.colors_en).length && vi.length && vi.every(x => SEED_EN[x] || isAscii(x))) {
            updates.colors_en = JSON.stringify(vi.map(x => SEED_EN[x] || x));
          }
        } else if (!row[`${c}_en`] && SEED_EN[row[c]]) {
          updates[`${c}_en`] = SEED_EN[row[c]];
        }
      }
      const keys = Object.keys(updates);
      if (keys.length) {
        db.prepare(`UPDATE ${table} SET ${keys.map(k => `${k}=?`).join(', ')} WHERE id=?`).run(...keys.map(k => updates[k]), row.id);
      }
    }
  }
  for (const r of db.prepare('SELECT key, value FROM site_settings').all()) {
    const seeded = JSON.stringify(seedSettingEn(JSON.parse(r.value)));
    if (seeded !== r.value) db.prepare('UPDATE site_settings SET value=? WHERE key=?').run(seeded, r.key);
  }
}
if (db.pragma('user_version', { simple: true }) < 1) {
  db.transaction(seedEnglishContent)();
  db.pragma('user_version = 1');
}

// ── Routes ──────────────────────────────────────────────

app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.json(wantsEn(req) ? rows.map(localizeCategory) : rows);
});

app.get('/api/collections', (req, res) => {
  const rows = db.prepare('SELECT * FROM collections ORDER BY id DESC').all();
  res.json(wantsEn(req) ? rows.map(localizeCollection) : rows);
});

app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const r of rows) { try { settings[r.key] = JSON.parse(r.value); } catch { settings[r.key] = null; } }
  res.json(wantsEn(req) ? localizeSetting(settings) : settings);
});

app.get('/api/products', (req, res) => {
  const { category, collection, featured, is_new, bridal, search, sort, page = 1, limit = 20 } = req.query;

  let q = `
    SELECT p.*, c.name AS category_name, c.name_en AS category_name_en, c.slug AS category_slug,
      col.name AS collection_name, col.name_en AS collection_name_en
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN collections col ON p.collection_id = col.id
    WHERE 1=1
  `;
  const params = [];

  if (category) { q += ' AND c.slug = ?'; params.push(category); }
  if (collection) { q += ' AND col.slug = ?'; params.push(collection); }
  if (featured === 'true') { q += ' AND p.is_featured = 1'; }
  if (is_new === 'true') { q += ' AND p.is_new = 1'; }
  if (bridal === 'true') { q += ' AND p.is_bridal = 1'; }
  if (search) { q += ' AND (p.name LIKE ? OR p.name_en LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  if (sort === 'price-asc') q += ' ORDER BY p.price ASC';
  else if (sort === 'price-desc') q += ' ORDER BY p.price DESC';
  else if (sort === 'name-asc') q += wantsEn(req) ? " ORDER BY COALESCE(NULLIF(p.name_en, ''), p.name) ASC" : ' ORDER BY p.name ASC';
  else if (sort === 'new') q += ' ORDER BY p.created_at DESC';
  else q += ' ORDER BY p.is_featured DESC, p.id DESC';

  const total = db.prepare(`SELECT COUNT(*) as n FROM (${q})`).get(...params).n;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  q += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const rows = db.prepare(q).all(...params).map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    sizes: JSON.parse(p.sizes || '[]'),
    colors: JSON.parse(p.colors || '[]'),
  }));

  res.json({ products: wantsEn(req) ? rows.map(localizeProduct) : rows, total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/products/:slug', (req, res) => {
  const p = db.prepare(`
    SELECT p.*, c.name AS category_name, c.name_en AS category_name_en, c.slug AS category_slug,
      col.name AS collection_name, col.name_en AS collection_name_en
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN collections col ON p.collection_id = col.id
    WHERE p.slug = ?
  `).get(req.params.slug);

  if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  p.images = JSON.parse(p.images || '[]');
  p.sizes = JSON.parse(p.sizes || '[]');
  p.colors = JSON.parse(p.colors || '[]');

  const related = db.prepare(`
    SELECT * FROM products WHERE category_id = ? AND id != ? LIMIT 4
  `).all(p.category_id, p.id).map(r => ({
    ...r,
    images: JSON.parse(r.images || '[]'),
    sizes: JSON.parse(r.sizes || '[]'),
    colors: JSON.parse(r.colors || '[]'),
  }));

  if (wantsEn(req)) return res.json({ ...localizeProduct(p), related: related.map(localizeProduct) });
  res.json({ ...p, related });
});

app.post('/api/contacts', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
  }
  const stmt = db.prepare('INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(name, email, phone || '', subject || 'Liên hệ chung', message);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Email không hợp lệ.' });
  }
  try {
    db.prepare('INSERT INTO subscribers (email) VALUES (?)').run(email);
    res.json({ success: true });
  } catch {
    res.status(409).json({ error: 'Email đã được đăng ký.' });
  }
});

// ── Admin Auth ────────────────────────────────────────────
const ADMIN_TOKEN_SECRET = 'lf_admin_2024_secret';

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const data = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString('utf-8'));
    if (data.secret === ADMIN_TOKEN_SECRET && Date.now() - data.ts < 86400000) next();
    else res.status(401).json({ error: 'Token expired' });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'lumierferre2024') {
    const token = Buffer.from(JSON.stringify({ secret: ADMIN_TOKEN_SECRET, ts: Date.now() })).toString('base64');
    res.json({ token, username });
  } else {
    res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  }
});

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as n FROM products').get().n;
  const totalOrders = db.prepare('SELECT COUNT(*) as n FROM orders').get().n;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as n FROM orders WHERE payment_status='paid'").get().n;
  const pendingOrders = db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='pending'").get().n;
  const newSubscribers = db.prepare('SELECT COUNT(*) as n FROM subscribers').get().n;
  const newMessages = db.prepare('SELECT COUNT(*) as n FROM contacts').get().n;
  res.json({ totalProducts, totalOrders, totalRevenue, pendingOrders, newSubscribers, newMessages });
});

app.get('/api/admin/products', requireAdmin, (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  let q = `SELECT p.*, c.name AS category_name, col.name AS collection_name
    FROM products p LEFT JOIN categories c ON p.category_id=c.id
    LEFT JOIN collections col ON p.collection_id=col.id WHERE 1=1`;
  const params = [];
  if (search) { q += ' AND (p.name LIKE ? OR p.name_en LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  q += ' ORDER BY p.id DESC';
  const total = db.prepare(`SELECT COUNT(*) as n FROM (${q})`).get(...params).n;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  q += ' LIMIT ? OFFSET ?'; params.push(parseInt(limit), offset);
  const rows = db.prepare(q).all(...params).map(p => ({
    ...p, images: JSON.parse(p.images||'[]'), sizes: JSON.parse(p.sizes||'[]'), colors: JSON.parse(p.colors||'[]'),
  }));
  res.json({ products: rows, total, page: parseInt(page) });
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, slug, price, original_price, category_id, collection_id, description, fabric, care,
    sizes, colors, images, is_featured, is_new, is_bridal, is_soldout,
    name_en, description_en, fabric_en, care_en, colors_en } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  // Tên trùng (vd: cùng mẫu khác màu) → thêm hậu tố -1, -2... để slug không bị trùng
  const base_slug = slugify(slug || name) || 'san-pham';
  const slugTaken = db.prepare('SELECT 1 FROM products WHERE slug = ?');
  let auto_slug = base_slug, n = 1;
  while (slugTaken.get(auto_slug)) auto_slug = `${base_slug}-${n++}`;
  try {
    const result = db.prepare(`INSERT INTO products (name,slug,price,original_price,category_id,collection_id,
      description,fabric,care,sizes,colors,images,is_featured,is_new,is_bridal,is_soldout,
      name_en,description_en,fabric_en,care_en,colors_en)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      name, auto_slug, parseInt(price), original_price?parseInt(original_price):null,
      category_id||null, collection_id||null, description||'', fabric||'', care||'',
      JSON.stringify(Array.isArray(sizes)?sizes:(sizes||'').split(',').map(s=>s.trim()).filter(Boolean)||['XS','S','M','L','XL']),
      JSON.stringify(Array.isArray(colors)?colors:(colors||'').split(',').map(s=>s.trim()).filter(Boolean)||['Đen','Trắng','Kem']),
      JSON.stringify(Array.isArray(images)?images:(images||'').split(',').map(s=>s.trim()).filter(Boolean)||[]),
      is_featured?1:0, is_new?1:0, is_bridal?1:0, is_soldout?1:0,
      name_en||'', description_en||'', fabric_en||'', care_en||'', JSON.stringify(toList(colors_en)));
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/admin/products/:id', requireAdmin, (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
  res.json({ ...p, images: JSON.parse(p.images||'[]'), sizes: JSON.parse(p.sizes||'[]'), colors: JSON.parse(p.colors||'[]'), colors_en: parseList(p.colors_en) });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const { name, price, original_price, category_id, collection_id, description, fabric, care,
    sizes, colors, images, is_featured, is_new, is_bridal, is_soldout,
    name_en, description_en, fabric_en, care_en, colors_en } = req.body;
  try {
    db.prepare(`UPDATE products SET name=?,price=?,original_price=?,category_id=?,collection_id=?,
      description=?,fabric=?,care=?,sizes=?,colors=?,images=?,is_featured=?,is_new=?,is_bridal=?,is_soldout=?,
      name_en=?,description_en=?,fabric_en=?,care_en=?,colors_en=?
      WHERE id=?`).run(name, parseInt(price), original_price?parseInt(original_price):null,
      category_id||null, collection_id||null, description||'', fabric||'', care||'',
      JSON.stringify(Array.isArray(sizes)?sizes:(sizes||'').split(',').map(s=>s.trim()).filter(Boolean)),
      JSON.stringify(Array.isArray(colors)?colors:(colors||'').split(',').map(s=>s.trim()).filter(Boolean)),
      JSON.stringify(Array.isArray(images)?images:(images||'').split('\n').map(s=>s.trim()).filter(Boolean)),
      is_featured?1:0, is_new?1:0, is_bridal?1:0, is_soldout?1:0,
      name_en||'', description_en||'', fabric_en||'', care_en||'', JSON.stringify(toList(colors_en)), req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let q = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status) { q += ' AND status=?'; params.push(status); }
  q += ' ORDER BY created_at DESC';
  const countQ = 'SELECT COUNT(*) as n FROM orders WHERE 1=1' + (status ? ' AND status=?' : '');
  const total = db.prepare(countQ).get(...(status?[status]:[])).n;
  const offset = (parseInt(page)-1)*parseInt(limit);
  q += ' LIMIT ? OFFSET ?'; params.push(parseInt(limit), offset);
  const rows = db.prepare(q).all(...params).map(o=>({...o, items: JSON.parse(o.items||'[]')}));
  res.json({ orders: rows, total, page: parseInt(page) });
});

// Đẩy đơn hàng lên KiotViet: map từng dòng hàng theo products.kiotviet_id
async function pushOrderToKiotViet({ customer_name, customer_email, customer_phone, customer_address, items, notes }) {
  const parsedItems = Array.isArray(items) ? items : JSON.parse(items || '[]');
  if (!parsedItems.length) return { status: 'skipped_no_items' };

  const findByLocalId = db.prepare('SELECT kiotviet_id FROM products WHERE id = ?');
  const mappedDetails = [];
  const unmapped = [];
  for (const item of parsedItems) {
    const productId = item.product_id || item.productId || item.product?.id;
    const qty = item.qty || item.quantity || 1;
    const price = item.price ?? item.product?.price ?? 0;
    const localProduct = productId ? findByLocalId.get(productId) : null;
    if (localProduct?.kiotviet_id) {
      mappedDetails.push({ productId: localProduct.kiotviet_id, quantity: qty, price });
    } else {
      unmapped.push(item.name || item.product?.name || `#${productId}`);
    }
  }

  if (!mappedDetails.length) {
    return { status: 'skipped_unmapped', error: `Không có sản phẩm nào liên kết với KiotViet: ${unmapped.join(', ')}` };
  }

  const branchId = await kiotviet.getDefaultBranchId();
  const customer = await kiotviet.findOrCreateCustomer({
    name: customer_name, phone: customer_phone, email: customer_email, address: customer_address,
  });
  const kvOrder = await kiotviet.createOrder({
    branchId,
    customerId: customer.id,
    orderDetails: mappedDetails,
    description: notes || `Đơn hàng website ${customer_name}`,
  });

  return {
    status: unmapped.length ? 'partial' : 'synced',
    kiotvietOrderId: kvOrder.id,
    kiotvietOrderCode: kvOrder.code,
    error: unmapped.length ? `Bỏ qua sản phẩm chưa liên kết KiotViet: ${unmapped.join(', ')}` : null,
  };
}

app.post('/api/admin/orders', requireAdmin, async (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address,
    items, subtotal, shipping, total, status, payment_method, payment_status, notes } = req.body;
  if (!customer_name) return res.status(400).json({ error: 'Thiếu tên khách hàng.' });
  const order_number = 'LF' + Date.now().toString().slice(-8);
  let result;
  try {
    result = db.prepare(`INSERT INTO orders (order_number,customer_name,customer_email,customer_phone,
    customer_address,items,subtotal,shipping,total,status,payment_method,payment_status,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(order_number, customer_name, customer_email||'',
    customer_phone||'', customer_address||'', JSON.stringify(items||[]),
    subtotal||0, shipping||0, total||0, status||'pending', payment_method||'bank_transfer',
    payment_status||'unpaid', notes||'');
  } catch (e) { return res.status(500).json({ error: e.message }); }

  const orderId = result.lastInsertRowid;
  let kiotvietSync = { status: 'not_configured' };
  if (kiotviet.isConfigured()) {
    try {
      kiotvietSync = await pushOrderToKiotViet({ customer_name, customer_email, customer_phone, customer_address, items, notes });
    } catch (e) {
      kiotvietSync = { status: 'error', error: e.message };
    }
    db.prepare('UPDATE orders SET kiotviet_order_id=?, kiotviet_order_code=?, kiotviet_sync_status=?, kiotviet_sync_error=? WHERE id=?')
      .run(kiotvietSync.kiotvietOrderId || null, kiotvietSync.kiotvietOrderCode || null, kiotvietSync.status, kiotvietSync.error || null, orderId);
  }

  res.json({ success: true, id: orderId, order_number, kiotviet: kiotvietSync });
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const current = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  // Chỉ ghi đè trường được gửi lên, tránh xóa/ghi lùi dữ liệu khi frontend gửi thiếu hoặc dữ liệu cũ
  const o = { ...current };
  for (const k of ['status', 'payment_status', 'notes', 'customer_name', 'customer_email', 'customer_phone', 'customer_address', 'shipping']) {
    if (req.body[k] !== undefined && req.body[k] !== null) o[k] = req.body[k];
  }
  if (!o.customer_name) return res.status(400).json({ error: 'Thiếu tên khách hàng.' });
  db.prepare(`UPDATE orders SET status=?,payment_status=?,notes=?,customer_name=?,
    customer_email=?,customer_phone=?,customer_address=?,shipping=? WHERE id=?`).run(
    o.status, o.payment_status, o.notes||'', o.customer_name, o.customer_email||'',
    o.customer_phone||'', o.customer_address||'', o.shipping||0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/contacts', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100').all());
});

app.get('/api/admin/subscribers', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC').all());
});

// ─── Upload ảnh (Cloudinary) ───────────────────────────────────────
app.post('/api/admin/upload', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file được gửi lên.' });
  if (!cloudinaryStore.isConfigured()) {
    return res.status(400).json({ error: 'Chưa cấu hình Cloudinary. Vui lòng điền CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET trong backend/.env' });
  }
  try {
    const result = await cloudinaryStore.uploadBuffer(req.file.buffer);
    res.json({ url: result.secure_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Site settings (Home / About / Contact / General) ──────────────
app.get('/api/admin/settings/:key', requireAdmin, (req, res) => {
  const row = getSetting.get(req.params.key);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy mục cài đặt.' });
  res.json(JSON.parse(row.value));
});

app.put('/api/admin/settings/:key', requireAdmin, (req, res) => {
  const { key } = req.params;
  if (!DEFAULT_SETTINGS[key]) return res.status(404).json({ error: 'Không tìm thấy mục cài đặt.' });
  db.prepare(`
    INSERT INTO site_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, JSON.stringify(req.body));
  res.json({ success: true });
});

// ─── Danh mục (Categories) ──────────────────────────────────────────
app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, description, image, sort_order, name_en, description_en } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên danh mục.' });
  try {
    const result = db.prepare('INSERT INTO categories (name, slug, description, image, sort_order, name_en, description_en) VALUES (?,?,?,?,?,?,?)')
      .run(name, slugify(name), description || '', image || '', sort_order || 0, name_en || '', description_en || '');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'Danh mục này đã tồn tại.' : e.message });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const { name, description, image, sort_order, name_en, description_en } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên danh mục.' });
  db.prepare('UPDATE categories SET name=?, description=?, image=?, sort_order=?, name_en=?, description_en=? WHERE id=?')
    .run(name, description || '', image || '', sort_order || 0, name_en || '', description_en || '', req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  try {
    // Gỡ liên kết sản phẩm trước, nếu không SQLite chặn xóa vì khóa ngoại
    db.transaction(() => {
      db.prepare('UPDATE products SET category_id=NULL WHERE category_id=?').run(req.params.id);
      db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
    })();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Bộ sưu tập (Collections) ────────────────────────────────────────
app.post('/api/admin/collections', requireAdmin, (req, res) => {
  const { name, season, description, cover_image, name_en, season_en, description_en } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên bộ sưu tập.' });
  try {
    const result = db.prepare(`INSERT INTO collections (name, slug, season, description, cover_image, name_en, season_en, description_en)
      VALUES (?,?,?,?,?,?,?,?)`)
      .run(name, slugify(name), season || '', description || '', cover_image || '', name_en || '', season_en || '', description_en || '');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'Bộ sưu tập này đã tồn tại.' : e.message });
  }
});

app.put('/api/admin/collections/:id', requireAdmin, (req, res) => {
  const { name, season, description, cover_image, name_en, season_en, description_en } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên bộ sưu tập.' });
  db.prepare('UPDATE collections SET name=?, season=?, description=?, cover_image=?, name_en=?, season_en=?, description_en=? WHERE id=?')
    .run(name, season || '', description || '', cover_image || '', name_en || '', season_en || '', description_en || '', req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/collections/:id', requireAdmin, (req, res) => {
  try {
    // Gỡ liên kết sản phẩm trước, nếu không SQLite chặn xóa vì khóa ngoại
    db.transaction(() => {
      db.prepare('UPDATE products SET collection_id=NULL WHERE collection_id=?').run(req.params.id);
      db.prepare('DELETE FROM collections WHERE id=?').run(req.params.id);
    })();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── KiotViet Integration ──────────────────────────────────────────
app.get('/api/admin/kiotviet/status', requireAdmin, async (_req, res) => {
  if (!kiotviet.isConfigured()) return res.json({ configured: false, connected: false });
  try {
    await kiotviet.getAccessToken();
    res.json({ configured: true, connected: true });
  } catch (e) {
    res.json({ configured: true, connected: false, error: e.message });
  }
});

app.post('/api/admin/kiotviet/sync-products', requireAdmin, async (_req, res) => {
  if (!kiotviet.isConfigured()) return res.status(400).json({ error: 'Chưa cấu hình kết nối KiotViet (backend/.env)' });
  try {
    const kvCategories = await kiotviet.getCategories();
    let catCreated = 0, catUpdated = 0;
    const findCatByKvId = db.prepare('SELECT id FROM categories WHERE kiotviet_id = ?');
    const findCatByName = db.prepare('SELECT id FROM categories WHERE lower(name) = lower(?) AND kiotviet_id IS NULL');
    const linkCat = db.prepare('UPDATE categories SET kiotviet_id = ?, kiotviet_code = ? WHERE id = ?');
    const insertCat = db.prepare(`INSERT INTO categories (name, slug, kiotviet_id, kiotviet_code, sort_order)
      VALUES (?,?,?,?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM categories))`);

    for (const c of kvCategories) {
      if (findCatByKvId.get(c.categoryId)) { catUpdated++; continue; }
      const byName = findCatByName.get(c.categoryName);
      if (byName) { linkCat.run(c.categoryId, c.categoryCode || null, byName.id); catUpdated++; }
      else { insertCat.run(c.categoryName, slugify(c.categoryName), c.categoryId, c.categoryCode || null); catCreated++; }
    }

    const kvProducts = await kiotviet.getProducts();
    let prodCreated = 0, prodUpdated = 0, skipped = 0;
    const findProdByKvId = db.prepare('SELECT id FROM products WHERE kiotviet_id = ?');
    const findCatIdByKvId = db.prepare('SELECT id FROM categories WHERE kiotviet_id = ?');
    const findProdBySlug = db.prepare('SELECT 1 FROM products WHERE slug = ?');
    const updateProd = db.prepare('UPDATE products SET name=?, price=?, category_id=?, is_soldout=?, kiotviet_code=? WHERE id=?');
    const insertProd = db.prepare(`INSERT INTO products (name, slug, price, category_id, description, images, kiotviet_id, kiotviet_code, is_soldout)
      VALUES (?,?,?,?,?,?,?,?,?)`);

    for (const p of kvProducts) {
      const localCat = p.categoryId ? findCatIdByKvId.get(p.categoryId) : null;
      const categoryId = localCat ? localCat.id : null;
      const onHand = Array.isArray(p.inventories) ? p.inventories.reduce((s, i) => s + (i.onHand || 0), 0) : null;
      const isSoldout = onHand !== null && onHand <= 0 ? 1 : 0;
      const images = Array.isArray(p.images) ? p.images.map(i => (typeof i === 'string' ? i : i.image)).filter(Boolean) : [];
      const name = p.fullName || p.name;

      const existing = findProdByKvId.get(p.id);
      if (existing) {
        updateProd.run(name, p.basePrice || 0, categoryId, isSoldout, p.code || null, existing.id);
        prodUpdated++;
      } else if (!categoryId) {
        skipped++;
      } else {
        let slug = slugify(name), uniqueSlug = slug, n = 1;
        while (findProdBySlug.get(uniqueSlug)) uniqueSlug = `${slug}-${n++}`;
        insertProd.run(name, uniqueSlug, p.basePrice || 0, categoryId, p.description || '', JSON.stringify(images), p.id, p.code || null, isSoldout);
        prodCreated++;
      }
    }

    res.json({
      success: true,
      categories: { total: kvCategories.length, created: catCreated, updated: catUpdated },
      products: { total: kvProducts.length, created: prodCreated, updated: prodUpdated, skipped },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/kiotviet/sync-customers', requireAdmin, async (_req, res) => {
  if (!kiotviet.isConfigured()) return res.status(400).json({ error: 'Chưa cấu hình kết nối KiotViet (backend/.env)' });
  try {
    const customers = await kiotviet.getCustomers();
    const upsert = db.prepare(`
      INSERT INTO kiotviet_customers (kiotviet_id, code, name, contact_number, email, address, synced_at)
      VALUES (?,?,?,?,?,?, CURRENT_TIMESTAMP)
      ON CONFLICT(kiotviet_id) DO UPDATE SET
        code=excluded.code, name=excluded.name, contact_number=excluded.contact_number,
        email=excluded.email, address=excluded.address, synced_at=CURRENT_TIMESTAMP
    `);
    for (const c of customers) {
      upsert.run(c.id, c.code || null, c.name || '', c.contactNumber || '', c.email || '', c.address || '');
    }
    res.json({ success: true, total: customers.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/kiotviet/customers', requireAdmin, (_req, res) => {
  res.json(db.prepare('SELECT * FROM kiotviet_customers ORDER BY synced_at DESC LIMIT 200').all());
});

// ─── User Auth ───────────────────────────────────────────────────
const USER_SALT = 'lf_user_salt_2024';
const hashPassword = (pw) => crypto.createHash('sha256').update(pw + USER_SALT).digest('hex');
const makeUserToken = (user) => Buffer.from(JSON.stringify({ id: user.id, email: user.email, name: user.name, ts: Date.now() })).toString('base64');

const requireUser = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    if (Date.now() - decoded.ts > 30 * 24 * 60 * 60 * 1000) return res.status(401).json({ error: 'Token expired' });
    req.userId = decoded.id;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

app.post('/api/users/register', (req, res) => {
  const { name, email, phone = '', password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
  if (password.length < 6) return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Email này đã được đăng ký.' });
  try {
    const result = db.prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
      .run(name.trim(), email.toLowerCase().trim(), phone.trim(), hashPassword(password));
    const user = { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim(), phone: phone.trim() };
    res.json({ token: makeUserToken(user), user });
  } catch (e) { res.status(500).json({ error: 'Lỗi máy chủ.' }); }
});

app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || user.password_hash !== hashPassword(password)) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
  const { password_hash, ...safeUser } = user;
  res.json({ token: makeUserToken(safeUser), user: safeUser });
});

app.get('/api/users/profile', requireUser, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  res.json(user);
});

app.put('/api/users/profile', requireUser, (req, res) => {
  const { name, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Tên không được để trống.' });
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name.trim(), (phone || '').trim(), req.userId);
  res.json({ success: true });
});

// ─── Patch broken images on startup
const mystiquePatch = db.prepare("SELECT images FROM products WHERE slug = 'vay-dai-mystique-maxi'").get();
if (mystiquePatch && mystiquePatch.images && mystiquePatch.images.includes('1566479179817')) {
  db.prepare("UPDATE products SET images = ? WHERE slug = 'vay-dai-mystique-maxi'").run(
    JSON.stringify(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&h=900&fit=crop'])
  );
}
const lacePatch = db.prepare("SELECT images FROM products WHERE slug = 'vay-lace-organza-midi'").get();
if (lacePatch && lacePatch.images && lacePatch.images.includes('1566479179817')) {
  db.prepare("UPDATE products SET images = ? WHERE slug = 'vay-lace-organza-midi'").run(
    JSON.stringify(['https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=700&h=900&fit=crop','https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=900&fit=crop'])
  );
}

// ─── Xử lý lỗi chung: luôn trả JSON để frontend hiện đúng thông báo ──
app.use('/api', (_req, res) => res.status(404).json({ error: 'Không tìm thấy API.' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File quá lớn (tối đa 20MB).' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Dữ liệu gửi lên quá lớn.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Dữ liệu gửi lên không hợp lệ.' });
  if (String(err.message).includes('NOT NULL')) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  res.status(500).json({ error: err.message || 'Lỗi máy chủ.' });
});

app.listen(PORT, () => {
  console.log(`✦ LUMIE FERRE Backend → http://localhost:${PORT}`);
});
