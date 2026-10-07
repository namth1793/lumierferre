import { useAdmin } from '../../context/AdminContext';

// Trường văn bản theo bản đang sửa: k('name') → 'name' (Tiếng Việt) hoặc 'name_en' (English)
export function useEditLang() {
  const { editLang } = useAdmin();
  const isEn = editLang === 'en';
  return { isEn, k: (key) => (isEn ? `${key}_en` : key) };
}

// Thanh chọn bản đang sửa, đặt đầu mỗi trang có nội dung hiển thị trên website
export function EditLangBar() {
  const { editLang, setEditLang } = useAdmin();
  const isEn = editLang === 'en';
  return (
    <div className={`mb-6 border p-4 flex flex-wrap items-center gap-4 justify-between ${isEn ? 'border-sky-200 bg-sky-50' : 'border-gray-100 bg-white'}`}>
      <div className="flex border border-black">
        {[['vi', 'Tiếng Việt'], ['en', 'English']].map(([code, label]) => (
          <button key={code} type="button" onClick={() => setEditLang(code)}
            className={`px-5 py-2 text-[10px] tracking-[0.2em] uppercase font-inter transition-colors ${editLang === code ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs font-inter text-gray-600 flex-1 min-w-[240px]">
        {isEn
          ? 'Đang sửa bản TIẾNG ANH. Ô nào để trống thì website tiếng Anh hiện nội dung tiếng Việt. Ảnh, giá, liên kết, số điện thoại dùng chung cho cả 2 bản.'
          : 'Đang sửa bản TIẾNG VIỆT. Chuyển sang English để nhập nội dung cho giao diện tiếng Anh.'}
      </p>
    </div>
  );
}

// Khi sửa bản tiếng Anh: hiện nội dung tiếng Việt ngay dưới ô để đối chiếu
export function ViHint({ text }) {
  const { editLang } = useAdmin();
  if (editLang !== 'en' || !text) return null;
  return (
    <p className="mt-1.5 text-[11px] leading-relaxed text-warm-gray font-inter whitespace-pre-line">
      <span className="text-[9px] tracking-[0.15em] mr-1.5 text-gray-400">VI:</span>{text}
    </p>
  );
}
