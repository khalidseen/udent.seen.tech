import { useState, useEffect, useRef } from 'react';
import { useVisualEditor } from '@/contexts/VisualEditorContext';

// ─── Constants ──────────────────────────────────────────────────

const EDIT_FIELD_LABELS: Record<string, string> = {
  text: 'نص',
  image: 'صورة',
};

const SOURCE_LABELS: Record<string, string> = {
  branding: 'هوية التطبيق',
  translation: 'ترجمة',
  db: 'قاعدة البيانات',
};

const Z = { toggle: 99990, hover: 99992, editor: 99995 } as const;

// ─── Helpers ────────────────────────────────────────────────────

function isVisualEditorElement(el: HTMLElement | null): boolean {
  while (el) {
    if (el.getAttribute('data-visual-editor') === 'true') return true;
    el = el.parentElement;
  }
  return false;
}

function findEditableElement(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current) {
    if (current.getAttribute('data-editable-type')) return current;
    current = current.parentElement;
  }
  return null;
}

function getEditableInfo(el: HTMLElement): { source: string; key: string; field: string } | null {
  const source = el.getAttribute('data-editable-type');
  const key = el.getAttribute('data-editable-key');
  if (!source || !key) return null;
  const field = el.getAttribute('data-editable-field') || 'text';
  return { source, key, field };
}

// ─── Main Component ─────────────────────────────────────────────

export function VisualEditor() {
  const ctx = useVisualEditor();

  // ── Local UI state ──
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ source: string; key: string; field: string } | null>(null);
  const [editRect, setEditRect] = useState<DOMRect | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const editInputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastTargetRef = useRef<HTMLElement | null>(null);

  // ── Refs that mirror context so event handlers never see stale values ──
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const editValueRef = useRef(editValue);
  editValueRef.current = editValue;

  const active = ctx.isEditorEnabled && ctx.canEdit;
  const activeRef = useRef(active);
  activeRef.current = active;

  // ── Single useEffect: register mousemove + click ONCE at mount ──
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!activeRef.current || ctxRef.current.isEditing) return;
      const target = e.target as HTMLElement;
      if (isVisualEditorElement(target)) {
        setHoverRect(null);
        setHoverInfo(null);
        lastTargetRef.current = null;
        return;
      }
      const editable = findEditableElement(target);
      if (editable && editable !== lastTargetRef.current) {
        lastTargetRef.current = editable;
        setHoverRect(editable.getBoundingClientRect());
        setHoverInfo(getEditableInfo(editable));
      } else if (!editable) {
        lastTargetRef.current = null;
        setHoverRect(null);
        setHoverInfo(null);
      }
    }

    function onClick(e: MouseEvent) {
      if (!activeRef.current || ctxRef.current.isEditing) return;
      const target = e.target as HTMLElement;
      if (isVisualEditorElement(target)) return;
      const editable = findEditableElement(target);
      if (!editable) return;

      e.preventDefault();
      e.stopPropagation();

      const info = getEditableInfo(editable);
      if (!info) return;

      if (info.field === 'image') {
        ctxRef.current.startEdit(editable);
        setEditRect(editable.getBoundingClientRect());
        setEditValue('');
        setTimeout(() => fileInputRef.current?.click(), 100);
      } else {
        const currentText = editable.textContent?.trim() || '';
        setEditValue(currentText);
        setEditRect(editable.getBoundingClientRect());
        ctxRef.current.startEdit(editable);
        setTimeout(() => editInputRef.current?.focus(), 50);
      }
      setHoverRect(null);
      setHoverInfo(null);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  // ── Keyboard shortcuts (always registered once) ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const { canEdit, isEditing, setEditorEnabled } = ctxRef.current;

      // Ctrl+Shift+E → toggle
      if (e.ctrlKey && e.shiftKey && e.key === 'E' && canEdit) {
        e.preventDefault();
        const next = !activeRef.current;
        setEditorEnabled(next);
        localStorage.setItem('visualEditorEnabled', next.toString());
        window.dispatchEvent(new CustomEvent('visualEditorToggle', { detail: { enabled: next } }));
        return;
      }

      if (!isEditing) return;

      // Escape → cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        ctxRef.current.cancelEdit();
        setEditRect(null);
        setEditValue('');
        return;
      }

      // Enter → save (text only)
      if (e.key === 'Enter' && !e.shiftKey && ctxRef.current.editTarget?.field === 'text') {
        e.preventDefault();
        doSave();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ── Clear hover when editor becomes inactive ──
  useEffect(() => {
    if (!active) {
      setHoverRect(null);
      setHoverInfo(null);
      lastTargetRef.current = null;
    }
  }, [active]);

  // ── Save / Cancel helpers ──
  async function doSave() {
    const val = editValueRef.current;
    if (!val.trim() && ctxRef.current.editTarget?.field === 'text') return;
    try {
      setSaving(true);
      await ctxRef.current.saveEdit(val);
    } catch (err) {
      console.error('VisualEditor save error', err);
    } finally {
      setSaving(false);
      setEditRect(null);
      setEditValue('');
    }
  }

  function doCancel() {
    ctxRef.current.cancelEdit();
    setEditRect(null);
    setEditValue('');
  }

  // ── Image file handler ──
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !ctxRef.current.editTarget) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setSaving(true);
        await ctxRef.current.saveEdit(reader.result as string);
      } catch (err) {
        console.error('VisualEditor image save error', err);
      } finally {
        setSaving(false);
        setEditRect(null);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Toggle handler ──
  function handleToggle() {
    if (!ctxRef.current.canEdit) return;
    if (ctxRef.current.isEditing) { doCancel(); return; }
    const next = !activeRef.current;
    ctx.setEditorEnabled(next);
    localStorage.setItem('visualEditorEnabled', next.toString());
    window.dispatchEvent(new CustomEvent('visualEditorToggle', { detail: { enabled: next } }));
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        data-visual-editor="true"
      />

      {ctx.isEditorEnabled && (
        <>
          {/* Toggle button — fixed bottom-left */}
          <button
            data-visual-editor="true"
            onClick={handleToggle}
            disabled={!ctx.canEdit}
            title={
              ctx.canEdit
                ? active
                  ? 'إيقاف المحرر المرئي (Ctrl+Shift+E)'
                  : 'تشغيل المحرر المرئي (Ctrl+Shift+E)'
                : 'ليس لديك صلاحية تعديل المحتوى'
            }
            style={{
              position: 'fixed',
              bottom: 56,
              left: 12,
              zIndex: Z.toggle,
              height: 36,
              borderRadius: 18,
              border: `2px solid ${active ? '#10b981' : '#6b7280'}`,
              background: active ? '#10b981' : '#374151',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: ctx.canEdit ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px 0 10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
              opacity: ctx.canEdit ? 0.85 : 0.55,
            }}
            onMouseEnter={(e) => { if (ctx.canEdit) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { if (ctx.canEdit) e.currentTarget.style.opacity = '0.85'; }}
          >
            <span style={{ fontSize: 15 }}>✏️</span>
            {active && <span style={{ fontSize: 10, opacity: 0.9 }}>ON</span>}
          </button>

          {/* Permission badge (shown when user cannot edit) */}
          {!ctx.canEdit && (
            <div data-visual-editor="true" style={{
              position: 'fixed',
              bottom: 96,
              left: 12,
              zIndex: Z.toggle,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(55, 65, 81, 0.85)',
              color: '#f3f4f6',
              fontSize: 11,
              fontWeight: 600,
              maxWidth: 220,
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              lineHeight: 1.2,
              direction: 'rtl',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                🔒
                <span style={{ opacity: 0.85 }}>التحرير غير متاح - مطلوب صلاحية</span>
              </span>
              <span style={{ marginInlineStart: 6, opacity: 0.75, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                can_manage_settings
              </span>
            </div>
          )}
        </>
      )}

      {/* Active indicator (visibility / ready state) */}
      {active && (
        <div data-visual-editor="true" style={{
          position: 'fixed',
          bottom: 96,
          left: 12,
          zIndex: Z.toggle,
          padding: '4px 10px',
          borderRadius: 999,
          background: 'rgba(16, 185, 129, 0.9)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}>
          <span>✅ جاهز للتحرير</span>
          <span style={{ opacity: 0.7 }}>Ctrl+Shift+E</span>
        </div>
      )}

      {/* Hover highlight — green border */}
      {active && hoverRect && !ctx.isEditing && hoverInfo && (
        <div data-visual-editor="true" style={{
          position: 'fixed',
          top: hoverRect.top - 2,
          left: hoverRect.left - 2,
          width: hoverRect.width + 4,
          height: hoverRect.height + 4,
          border: '2px solid #10b981',
          borderRadius: 6,
          background: 'rgba(16, 185, 129, 0.08)',
          pointerEvents: 'none',
          zIndex: Z.hover,
          transition: 'all 0.05s ease-out',
        }}>
          <span style={{
            position: 'absolute',
            top: -26,
            left: 0,
            background: '#10b981',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px 4px 0 0',
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span>✏️</span>
            <span>{SOURCE_LABELS[hoverInfo.source] || hoverInfo.source}</span>
            <span style={{ opacity: 0.7 }}>•</span>
            <span>{EDIT_FIELD_LABELS[hoverInfo.field] || hoverInfo.field}</span>
          </span>
        </div>
      )}

      {/* Inline text editor */}
      {ctx.isEditing && ctx.editTarget?.field === 'text' && editRect && (
        <div data-visual-editor="true" style={{
          position: 'fixed',
          top: editRect.top - 4,
          left: editRect.left - 4,
          zIndex: Z.editor,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}>
          <div style={{
            display: 'flex',
            gap: 4,
            padding: '4px 6px',
            background: '#1f2937',
            borderRadius: '8px 8px 0 0',
            border: '2px solid #10b981',
            borderBottom: 'none',
            alignItems: 'center',
          }}>
            <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, marginInlineEnd: 4, direction: 'rtl' }}>
              تحرير {EDIT_FIELD_LABELS[ctx.editTarget.field]} — {SOURCE_LABELS[ctx.editTarget.source]}
            </span>
            <button
              data-visual-editor="true"
              onClick={doSave}
              disabled={saving}
              style={{
                background: '#10b981', border: 'none', color: '#fff', borderRadius: 4,
                padding: '3px 10px', fontSize: 12, fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? '...' : '✓ حفظ'}
            </button>
            <button
              data-visual-editor="true"
              onClick={doCancel}
              style={{
                background: '#374151', border: '1px solid #4b5563', color: '#d1d5db',
                borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ✕ إلغاء
            </button>
          </div>
          <textarea
            ref={editInputRef}
            data-visual-editor="true"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{
              minWidth: Math.max(editRect.width + 8, 200),
              minHeight: Math.max(editRect.height + 8, 36),
              maxWidth: 500, maxHeight: 200,
              padding: '6px 10px', fontSize: 14, fontFamily: 'system-ui, sans-serif',
              border: '2px solid #10b981', borderTop: 'none', borderRadius: '0 0 8px 8px',
              background: '#fff', color: '#111827', resize: 'both', outline: 'none',
              direction: document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr',
            }}
          />
        </div>
      )}

      {/* Image edit overlay */}
      {ctx.isEditing && ctx.editTarget?.field === 'image' && editRect && (
        <div data-visual-editor="true" style={{
          position: 'fixed',
          top: editRect.top - 2, left: editRect.left - 2,
          width: editRect.width + 4, height: editRect.height + 4,
          border: '3px solid #10b981', borderRadius: 8,
          background: 'rgba(16, 185, 129, 0.12)',
          zIndex: Z.editor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <button
            data-visual-editor="true"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#10b981', border: 'none', color: '#fff', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            📷 {saving ? 'جارِ الحفظ...' : 'تغيير الصورة'}
          </button>
          <button
            data-visual-editor="true"
            onClick={doCancel}
            style={{
              background: '#374151', border: '1px solid #4b5563', color: '#d1d5db',
              borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* CSS hover outlines when active */}
      {active && !ctx.isEditing && (
        <style data-visual-editor="true">{`
          [data-editable-type] { cursor: pointer !important; }
          [data-editable-type]:hover { outline: 2px dashed rgba(16, 185, 129, 0.4) !important; outline-offset: 2px; }
          [data-visual-editor="true"] { cursor: default !important; }
          [data-visual-editor="true"] button { cursor: pointer !important; }
        `}</style>
      )}
    </>
  );
}

