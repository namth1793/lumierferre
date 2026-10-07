import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { ImageUploaderMulti } from '../../components/admin/ImageUploader';
import { EditLangBar, ViHint, useEditLang } from '../../components/admin/Bilingual';

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { authFetch } = useAdmin();
  const navigate = useNavigate();
  const { isEn, k } = useEditLang();

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', price: '', original_price: '', category_id: '', collection_id: '',
    description: '', fabric: '', care: '',
    sizes: 'XS,S,M,L,XL', colors: 'Đen,Trắng,Kem',
    images: [],
    is_featured: false, is_new: false, is_bridal: false, is_soldout: false,
    name_en: '', description_en: '', fabric_en: '', care_en: '', colors_en: '',
  });

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {});
    fetch('/api/collections').then(r => r.json()).then(setCollections).catch(() => {});
    if (isEdit) {
      setLoading(true);
      authFetch(`/api/admin/products/${id}`).then(async r => {
        const p = await r.json();
        if (!r.ok) { setError(p.error || 'Không tải được sản phẩm'); return; }
        setForm({
          name: p.name || '', price: p.price || '', original_price: p.original_price || '',
          category_id: p.category_id || '', collection_id: p.collection_id || '',
          description: p.description || '', fabric: p.fabric || '', care: p.care || '',
          sizes: (p.sizes || []).join(','), colors: (p.colors || []).join(','),
          images: p.images || [],
          is_featured: !!p.is_featured, is_new: !!p.is_new,
          is_bridal: !!p.is_bridal, is_soldout: !!p.is_soldout,
          name_en: p.name_en || '', description_en: p.description_en || '', fabric_en: p.fabric_en || '',
          care_en: p.care_en || '', colors_en: (p.colors_en || []).join(','),
        });
      }).catch(() => setError('Không thể kết nối máy chủ')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { setError('Vui lòng điền tên sản phẩm (bản tiếng Việt) và giá.'); return; }
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
        colors_en: form.colors_en.split(',').map(s => s.trim()).filter(Boolean),
        images: form.images,
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

      <EditLangBar />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-100 p-6 space-y-5">
          <h2 className="text-[10px] tracking-[0.25em] uppercase text-warm-gray">Thông Tin Cơ Bản</h2>
          <div>
            <label className={labelCls}>Tên sản phẩm {!isEn && <span className="text-red-500">*</span>}</label>
            <input type="text" name={k('name')} required={!isEn} value={form[k('name')]} onChange={handleChange} className={inputCls} placeholder={isEn ? 'Product name' : 'Tên sản phẩm'} />
            <ViHint text={form.name} />
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
            <textarea name={k('description')} rows={4} value={form[k('description')]} onChange={handleChange} className={inputCls + ' resize-none'} placeholder={isEn ? 'Product description...' : 'Mô tả sản phẩm...'} />
            <ViHint text={form.description} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Chất liệu</label>
              <input type="text" name={k('fabric')} value={form[k('fabric')]} onChange={handleChange} className={inputCls} placeholder={isEn ? '100% mulberry silk...' : 'Lụa tơ tằm 100%...'} />
              <ViHint text={form.fabric} />
            </div>
            <div>
              <label className={labelCls}>Hướng dẫn giặt</label>
              <input type="text" name={k('care')} value={form[k('care')]} onChange={handleChange} className={inputCls} placeholder={isEn ? 'Hand wash in cold water...' : 'Giặt tay nước lạnh...'} />
              <ViHint text={form.care} />
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
              <label className={labelCls}>Màu sắc (cách nhau bằng dấu phẩy{isEn ? ', đúng thứ tự như bản tiếng Việt' : ''})</label>
              <input type="text" name={k('colors')} value={form[k('colors')]} onChange={handleChange} className={inputCls} placeholder={isEn ? 'Black,White,Cream' : 'Đen,Trắng,Kem'} />
              <ViHint text={form.colors} />
            </div>
          </div>
          <ImageUploaderMulti
            label="Hình ảnh sản phẩm"
            value={form.images}
            onChange={(images) => setForm(f => ({ ...f, images }))}
          />
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
