import React, { useState, useRef, useCallback } from 'react';
import { useWarranty } from '../contexts/WarrantyContext';

const WARRANTY_REASONS = [
  { value: 'manufacturing', label: 'Lỗi sản xuất',        icon: '🏭', desc: 'Khuyết tật từ nhà sản xuất, chất lượng không đạt tiêu chuẩn' },
  { value: 'shipping',      label: 'Hư hỏng vận chuyển',  icon: '📦', desc: 'Sản phẩm bị va đập, hỏng hóc trong quá trình giao hàng' },
  { value: 'material',      label: 'Lỗi vật liệu',        icon: '⚠️', desc: 'Vật liệu kém chất lượng, nứt gãy bất thường khi sử dụng' },
  { value: 'mismatch',      label: 'Không đúng mô tả',    icon: '🔍', desc: 'Sản phẩm nhận được khác với thông tin trên trang web' },
  { value: 'functional',    label: 'Hỏng chức năng',      icon: '🔧', desc: 'Sản phẩm không hoạt động đúng như thiết kế ban đầu' },
];

const MAX_IMAGES = 5;

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────
const StepBar = ({ step }) => (
  <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
    {['Lý do', 'Hình ảnh / Video', 'Xác nhận'].map((label, i) => {
      const n = i + 1;
      const active = step === n;
      const done   = step > n;
      return (
        <React.Fragment key={n}>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${done ? 'bg-emerald-500 text-white' : active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {done ? '✓' : n}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? 'text-gray-900' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < 2 && <div className={`flex-1 h-px ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── IMAGE UPLOAD ZONE ────────────────────────────────────────────────────────
const ImageUploadZone = ({ images, onAdd, onRemove }) => {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    onAdd(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')));
  }, [onAdd]);

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Ảnh sản phẩm khi mở hàng{' '}
        <span className="text-gray-400 font-normal">({images.length}/{MAX_IMAGES})</span>
      </p>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => ref.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
        >
          <span className="text-2xl">📷</span>
          <p className="text-xs text-gray-500 text-center">
            Kéo thả ảnh vào đây hoặc <span className="text-blue-600 font-semibold">chọn file</span>
            <br /><span className="text-gray-400">JPG, PNG · Tối đa {MAX_IMAGES} ảnh</span>
          </p>
          <input ref={ref} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => onAdd(Array.from(e.target.files))} />
        </div>
      )}
    </div>
  );
};

// ─── VIDEO UPLOAD ─────────────────────────────────────────────────────────────
const VideoUpload = ({ video, onSet, onRemove }) => {
  const ref = useRef();
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Video mở hàng <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
      </p>
      {video ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-2xl">🎬</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{video.name}</p>
            <p className="text-xs text-gray-400">{(video.file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button type="button" onClick={onRemove}
            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
            Xoá
          </button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()}
          className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white cursor-pointer transition-all">
          <span className="text-2xl">🎥</span>
          <p className="text-xs text-gray-500 text-center">
            Tải lên video mở hộp sản phẩm
            <br /><span className="text-gray-400">MP4, MOV · Tối đa 100 MB</span>
          </p>
          <input ref={ref} type="file" accept="video/*" className="hidden"
            onChange={(e) => e.target.files[0] && onSet({ file: e.target.files[0], name: e.target.files[0].name })} />
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between items-start gap-3">
    <span className="text-xs text-gray-400 shrink-0">{label}</span>
    <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
  </div>
);

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
const WarrantyFormModal = ({ order, orderDetail, serialNumbers = [], userId, onClose, onSuccess }) => {
  const { createClaim } = useWarranty();
  const [step, setStep]               = useState(1);
  const [reason, setReason]           = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages]           = useState([]);
  const [video, setVideo]             = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);

  const selectedReason = WARRANTY_REASONS.find((r) => r.value === reason);

  const addImages = (files) => {
    const next = files
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - images.length)
      .map((f) => ({ file: f, name: f.name, preview: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createClaim({
        orderId:        order.orderId,
        orderDetailId:  orderDetail.orderDetailId,
        productName:    orderDetail.productName,
        serialNumber: serialNumbers.join(', '),
        reasonCategory: reason,
        reasonLabel:    selectedReason?.label || reason,
        description,
        imageFiles:     images.map((i) => i.file),
        videoFile:      video,
        customerId:     userId,
        customerName:   order.receiverName,
      });
      setDone(true);
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!done ? onClose : undefined} />

      <div className="relative w-full sm:max-w-lg max-h-[94vh] sm:max-h-[88vh] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Yêu cầu bảo hành</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{orderDetail.productName}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg">
            ✕
          </button>
        </div>

        {/* ── Done state ── */}
        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✅</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Gửi yêu cầu thành công!</h3>
              <p className="text-sm text-gray-500 mt-1">
                Yêu cầu bảo hành của bạn đã được ghi nhận.<br />
                Chúng tôi sẽ liên hệ trong vòng 1–3 ngày làm việc.
              </p>
            </div>
            <button onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors">
              Đóng
            </button>
          </div>
        ) : (
          <>
            <StepBar step={step} />

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* ── Step 1: Thông tin & lý do ── */}
              {step === 1 && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl mt-0.5">🏸</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{orderDetail.productName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Đơn hàng #{order.orderId}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {serialNumbers.map((sn) => (
                          <div key={sn} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                            <span className="text-xs text-gray-400">Seri:</span>
                            <span className="text-xs font-mono font-bold text-gray-800 tracking-wider">{sn}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Lý do bảo hành <span className="text-red-400">*</span>
                    </p>
                    <div className="space-y-2">
                      {WARRANTY_REASONS.map((r) => (
                        <label key={r.value}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
                            ${reason === r.value
                              ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                          <input type="radio" name="reason" value={r.value}
                            checked={reason === r.value} onChange={() => setReason(r.value)}
                            className="mt-0.5 accent-gray-900" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{r.icon} {r.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Mô tả chi tiết <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                    </p>
                    <textarea
                      value={description} onChange={(e) => setDescription(e.target.value)}
                      rows={3} placeholder="Mô tả tình trạng sản phẩm, thời điểm phát hiện lỗi..."
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
                  </div>
                </>
              )}

              {/* ── Step 2: Media ── */}
              {step === 2 && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                    <span className="text-base mt-0.5">💡</span>
                    <p className="text-xs text-amber-700">
                      Ảnh và video mở hàng giúp xác minh nhanh hơn. Vui lòng quay rõ tem niêm phong, bao bì và phần bị lỗi.
                    </p>
                  </div>
                  <ImageUploadZone images={images} onAdd={addImages}
                    onRemove={(i) => setImages((prev) => prev.filter((_, idx) => idx !== i))} />
                  <VideoUpload video={video} onSet={setVideo} onRemove={() => setVideo(null)} />
                </>
              )}

              {/* ── Step 3: Xác nhận ── */}
              {step === 3 && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin bảo hành</p>
                    <Row label="Sản phẩm"    value={orderDetail.productName} />
                    <Row label="Số seri"     value={<span className="font-mono">{serialNumbers.join(', ')}</span>} />
                    <Row label="Đơn hàng"    value={`#${order.orderId}`} />
                    <Row label="Lý do"       value={selectedReason ? `${selectedReason.icon} ${selectedReason.label}` : '—'} />
                    {description && <Row label="Mô tả" value={description} />}
                    <Row label="Ảnh đính kèm" value={images.length > 0 ? `${images.length} ảnh` : 'Không có'} />
                    <Row label="Video"       value={video ? video.name : 'Không có'} />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
                    <span className="text-base mt-0.5">ℹ️</span>
                    <p className="text-xs text-blue-700">
                      Sau khi gửi, đội ngũ hỗ trợ sẽ xem xét trong <strong>1–3 ngày làm việc</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
              {step > 1 && (
                <button onClick={() => setStep((s) => s - 1)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Quay lại
                </button>
              )}
              {step < 3 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !reason}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Tiếp tục
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Đang gửi...' : '✅ Xác nhận gửi yêu cầu'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WarrantyFormModal;
