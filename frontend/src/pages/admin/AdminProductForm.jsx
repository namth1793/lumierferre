import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { authFetch } = useAdmin();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', price: '', original_price: '', category_id: '', collection_id: '',
    description: '', fabric: '', care: '',
    sizes: 'XS,S,M,L,XL', colors: 'Đen,Trắng,Kem',
    images: '',
    is_featured: false, is_new: false, is_bridal: false, is_soldout: false,
  });

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {});
    fetch('/api/collections').then(r => r.json()).then(setCollections).catch(() => {});
    if (isEdit) {
      setLoading(true);
      authFetch(`/api/admin/products?search=`).then(r => r.json()).then(data => {
        // Actually fetch product by slug via public API or find in admin list
        setLoading(false);
      }).catch(() => setLoading(false));
      // Fetch via public products list
      fetch(`/api/products?limit=500`).then(r => r.json()).then(data => {
        const p = data.products?.find(x => x.id === parseInt(id));
        if (p) {
          setForm({
            name: p.name || '', price: p.price || '', original_price: p.original_price || '',
            category_id: p.category_id || '', collection_id: p.collection_id || '',
            description: p.description || '', fabric: p.fabric || '', care: p.care || '',
            sizes: (p.sizes || []).join(','), colors: (p.colors || []).join(','),
            images: (p.images || []).join('\n'),
            is_featured: !!p.is_featured, is_new: !!p.is_new,
            is_bridal: !!p.is_bridal, is_soldout: !!p.is_soldout,
          });
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { setError('Vui lòng điền tên và giá sản phẩm.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        price: parseInt(form.price),
        original_price: form.original_price ? parseInt(form.original_price) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        collection_id: form.collection_id ? parseInt(form.collection_id) : null,
        sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
        images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
      };
      const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) navigate('/admin/products');
      else setError(data.error || 'Lỗi khi lưu sản phẩm');
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center font-inter text-sm text-warm-gray">Đang tải...</div>;

  const inputCls = "w-full border border-gray-200 px-4 py-3 text-sm font-inter outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2";

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-1">{isEdit ? 'Chỉnh Sửa' : 'Thêm Mới'}</p>
        <h1 className="font-cormorant text-3xl font-light tracking-[0.08em]">{isEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Thông Tin Cơ Bản</h2>
          <div>
            <label className={labelCls}>Tên sản phẩm <span className="text-red-500">*</span></label>
            <input type="text" name="name" required value={form.name} onChange={handleChange} className={inputCls} placeholder="Tên sản phẩm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Giá (₫) <span className="text-red-500">*</span></label>
              <input type="number" name="price" required value={form.price} onChange={handleChange} className={inputCls} placeholder="12000000" />
            </div>
            <div>
              <label className={labelCls}>Giá gốc (₫)</label>
              <input type="number" name="original_price" value={form.original_price} onChange={handleChange} className={inputCls} placeholder="Để trống nếu không giảm giá" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Danh mục</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className={inputCls + ' bg-white cursor-pointer'}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bộ sưu tập</label>
              <select name="collection_id" value={form.collection_id} onChange={handleChange} className={inputCls + ' bg-white cursor-pointer'}>
                <option value="">-- Chọn bộ sưu tập --</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Mô Tả & Chất Liệu</h2>
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea name="description" rows={4} value={form.description} onChange={handleChange} className={inputCls + ' resize-none'} placeholder="Mô tả sản phẩm..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Chất liệu</label>
              <input type="text" name="fabric" value={form.fabric} onChange={handleChange} className={inputCls} placeholder="Lụa tơ tằm 100%..." />
            </div>
            <div>
              <label className={labelCls}>Hướng dẫn giặt</label>
              <input type="text" name="care" value={form.care} onChange={handleChange} className={inputCls} placeholder="Giặt tay nước lạnh..." />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Biến Thể & Hình Ảnh</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sizes (cách nhau bằng dấu phẩy)</label>
              <input type="text" name="sizes" value={form.sizes} onChange={handleChange} className={inputCls} placeholder="XS,S,M,L,XL" />
            </div>
            <div>
              <label className={labelCls}>Màu sắc (cách nhau bằng dấu phẩy)</label>
              <input type="text" name="colors" value={form.colors} onChange={handleChange} className={inputCls} placeholder="Đen,Trắng,Kem" />
            </div>
          </div>
          <div>
            <label className={labelCls}>URLs hình ảnh (mỗi URL một dòng)</label>
            <textarea name="images" rows={4} value={form.images} onChange={handleChange} className={inputCls + ' resize-none'} placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..." />
            <p className="text-[10px] text-warm-gray font-inter mt-1">Ảnh đầu tiên là ảnh chính. Khuyến nghị: Unsplash URL với ?w=700&h=900&fit=crop</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray mb-5">Hiển Thị</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'is_featured', label: 'Nổi bật' },
              { name: 'is_new', label: 'Mới ra' },
              { name: 'is_bridal', label: 'Bridal' },
              { name: 'is_soldout', label: 'Hết hàng' },
            ].map(f => (
              <label key={f.name} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name={f.name} checked={form[f.name]} onChange={handleChange}
                  className="w-4 h-4 accent-black" />
                <span className="text-sm font-inter">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-inter">{error}</p>}

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="btn-dark">
            {saving ? 'ĐANG LƯU...' : isEdit ? 'CẬP NHẬT' : 'TẠO SẢN PHẨM'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-outline">HỦY</button>
        </div>
      </form>
    </div>
  );
}
