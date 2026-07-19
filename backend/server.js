const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5033;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'lumierferre.db'));

app.use(cors());
app.use(express.json());

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
`);

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
  insertCol.run('La Pureza FW25', 'la-pureza-fw25', 'Fall Winter 2025',
    'Bộ sưu tập Thu Đông 2025 — Sự tinh khiết thuần túy trong từng thớ vải cao cấp.',
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

// Patch broken image URLs (runs every startup to fix existing DB)
db.prepare(`
  UPDATE products SET images = ? WHERE slug = 'vay-cocktail-metallic'
    AND images LIKE '%1594938298603%'
`).run(JSON.stringify([
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=900&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&h=900&fit=crop',
]));

// ── Routes ──────────────────────────────────────────────

app.get('/api/categories', (_req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order').all());
});

app.get('/api/collections', (_req, res) => {
  res.json(db.prepare('SELECT * FROM collections ORDER BY id DESC').all());
});

app.get('/api/products', (req, res) => {
  const { category, collection, featured, is_new, bridal, search, sort, page = 1, limit = 20 } = req.query;

  let q = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug, col.name AS collection_name
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
  if (search) { q += ' AND p.name LIKE ?'; params.push(`%${search}%`); }

  if (sort === 'price-asc') q += ' ORDER BY p.price ASC';
  else if (sort === 'price-desc') q += ' ORDER BY p.price DESC';
  else if (sort === 'name-asc') q += ' ORDER BY p.name ASC';
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

  res.json({ products: rows, total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/products/:slug', (req, res) => {
  const p = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug, col.name AS collection_name
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
  if (search) { q += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
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
    sizes, colors, images, is_featured, is_new, is_bridal, is_soldout } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc.' });
  const auto_slug = (slug || name).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/đ/g,'d').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').trim();
  try {
    const result = db.prepare(`INSERT INTO products (name,slug,price,original_price,category_id,collection_id,
      description,fabric,care,sizes,colors,images,is_featured,is_new,is_bridal,is_soldout)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      name, auto_slug, parseInt(price), original_price?parseInt(original_price):null,
      category_id||null, collection_id||null, description||'', fabric||'', care||'',
      JSON.stringify(Array.isArray(sizes)?sizes:(sizes||'').split(',').map(s=>s.trim()).filter(Boolean)||['XS','S','M','L','XL']),
      JSON.stringify(Array.isArray(colors)?colors:(colors||'').split(',').map(s=>s.trim()).filter(Boolean)||['Đen','Trắng','Kem']),
      JSON.stringify(Array.isArray(images)?images:(images||'').split(',').map(s=>s.trim()).filter(Boolean)||[]),
      is_featured?1:0, is_new?1:0, is_bridal?1:0, is_soldout?1:0);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const { name, price, original_price, category_id, collection_id, description, fabric, care,
    sizes, colors, images, is_featured, is_new, is_bridal, is_soldout } = req.body;
  try {
    db.prepare(`UPDATE products SET name=?,price=?,original_price=?,category_id=?,collection_id=?,
      description=?,fabric=?,care=?,sizes=?,colors=?,images=?,is_featured=?,is_new=?,is_bridal=?,is_soldout=?
      WHERE id=?`).run(name, parseInt(price), original_price?parseInt(original_price):null,
      category_id||null, collection_id||null, description||'', fabric||'', care||'',
      JSON.stringify(Array.isArray(sizes)?sizes:(sizes||'').split(',').map(s=>s.trim()).filter(Boolean)),
      JSON.stringify(Array.isArray(colors)?colors:(colors||'').split(',').map(s=>s.trim()).filter(Boolean)),
      JSON.stringify(Array.isArray(images)?images:(images||'').split('\n').map(s=>s.trim()).filter(Boolean)),
      is_featured?1:0, is_new?1:0, is_bridal?1:0, is_soldout?1:0, req.params.id);
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

app.post('/api/admin/orders', requireAdmin, (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address,
    items, subtotal, shipping, total, status, payment_method, payment_status, notes } = req.body;
  if (!customer_name) return res.status(400).json({ error: 'Thiếu tên khách hàng.' });
  const order_number = 'LF' + Date.now().toString().slice(-8);
  const result = db.prepare(`INSERT INTO orders (order_number,customer_name,customer_email,customer_phone,
    customer_address,items,subtotal,shipping,total,status,payment_method,payment_status,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(order_number, customer_name, customer_email||'',
    customer_phone||'', customer_address||'', JSON.stringify(items||[]),
    subtotal||0, shipping||0, total||0, status||'pending', payment_method||'bank_transfer',
    payment_status||'unpaid', notes||'');
  res.json({ success: true, id: result.lastInsertRowid, order_number });
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const { status, payment_status, notes, customer_name, customer_email, customer_phone, customer_address, shipping } = req.body;
  db.prepare(`UPDATE orders SET status=?,payment_status=?,notes=?,customer_name=?,
    customer_email=?,customer_phone=?,customer_address=?,shipping=? WHERE id=?`).run(
    status, payment_status, notes||'', customer_name, customer_email||'',
    customer_phone||'', customer_address||'', shipping||0, req.params.id);
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

app.listen(PORT, () => {
  console.log(`✦ Lumière Ferré Backend → http://localhost:${PORT}`);
});
