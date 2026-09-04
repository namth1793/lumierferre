import { useRef, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';

// Single-image uploader: value is a URL string, onChange(url) is called after upload.
export function ImageUploaderSingle({ value, onChange, label }) {
  const { admin } = useAdmin();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${admin?.token || ''}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) onChange(data.url);
      else setError(data.error || 'Lỗi khi upload ảnh');
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      {label && <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">{label}</label>}
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-warm-gray font-inter">Chưa có ảnh</span>}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="btn-outline text-xs px-4 py-2 disabled:opacity-50">
            {uploading ? 'Đang tải...' : 'Chọn ảnh'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-[10px] text-red-500 font-inter underline underline-offset-2">Xóa ảnh</button>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleFile(e.target.files?.[0])} />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs font-inter mt-2">{error}</p>}
    </div>
  );
}

// Multi-image uploader: value is an array of URLs, onChange(urls) called after any change.
export function ImageUploaderMulti({ value = [], onChange, label }) {
  const { admin } = useAdmin();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true); setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${admin?.token || ''}` },
          body: fd,
        });
        const data = await res.json();
        if (res.ok) uploaded.push(data.url);
        else { setError(data.error || 'Lỗi khi upload ảnh'); break; }
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
    } catch { setError('Không thể kết nối máy chủ'); }
    finally { setUploading(false); }
  };

  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      {label && <label className="block text-[10px] tracking-[0.2em] uppercase font-inter text-warm-gray mb-2">{label}</label>}
      <div className="flex flex-wrap gap-3 mb-3">
        {value.map((url, i) => (
          <div key={i} className="relative w-24 h-28 bg-gray-50 border border-gray-200 overflow-hidden group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            {i === 0 && <span className="absolute top-1 left-1 text-[8px] bg-black text-white px-1.5 py-0.5 tracking-wide">CHÍNH</span>}
            <button type="button" onClick={() => removeAt(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-24 h-28 border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-warm-gray font-inter hover:border-black transition-colors disabled:opacity-50">
          {uploading ? 'Đang tải...' : '+ Thêm ảnh'}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => handleFiles(Array.from(e.target.files || []))} />
      <p className="text-[10px] text-warm-gray font-inter">Ảnh đầu tiên là ảnh chính. Có thể chọn nhiều ảnh cùng lúc.</p>
      {error && <p className="text-red-500 text-xs font-inter mt-2">{error}</p>}
    </div>
  );
}
