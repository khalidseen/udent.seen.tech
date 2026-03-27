import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────

interface ElementInfo {
  element: HTMLElement;
  componentName: string | null;
  filePath: string | null;
  elementType: string;
  elementTypeAr: string;
  label: string;
  selector: string;
  mapIds: MapIdInfo[];
  rect: DOMRect;
}

interface MapIdInfo {
  id: string;
  type: 'page' | 'zone' | 'component' | 'anchor';
  label: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  page: 'Page',
  zone: 'Zone',
  component: 'Component',
  anchor: 'Anchor Point',
};

const ELEMENT_TYPE_AR: Record<string, string> = {
  button: 'زر',
  link: 'رابط',
  input: 'حقل إدخال',
  textarea: 'منطقة نص',
  select: 'قائمة منسدلة',
  checkbox: 'مربع اختيار',
  radio: 'زر راديو',
  switch: 'مفتاح تبديل',
  image: 'صورة',
  icon: 'أيقونة',
  card: 'بطاقة',
  text: 'نص',
  heading: 'عنوان',
  list: 'قائمة',
  listItem: 'عنصر قائمة',
  nav: 'قائمة تنقل',
  sidebar: 'شريط جانبي',
  header: 'ترويسة',
  footer: 'تذييل',
  section: 'قسم',
  form: 'نموذج',
  table: 'جدول',
  dialog: 'نافذة حوار',
  badge: 'شارة',
  avatar: 'صورة شخصية',
  tab: 'تبويب',
  dropdown: 'قائمة منسدلة',
  container: 'حاوية',
  unknown: 'عنصر',
};

const SEMANTIC_CONTAINERS = new Set([
  'nav', 'aside', 'main', 'section', 'article', 'form',
  'header', 'footer', 'ul', 'ol', 'table', 'dialog',
]);

// ─── Utility Functions ──────────────────────────────────────────────

function getMapIdType(id: string): MapIdInfo['type'] {
  if (id.startsWith('P-')) return 'page';
  if (id.startsWith('Z-')) return 'zone';
  if (id.startsWith('C-')) return 'component';
  if (id.startsWith('AP-')) return 'anchor';
  return 'component';
}

function collectMapIds(element: HTMLElement): MapIdInfo[] {
  const ids: MapIdInfo[] = [];
  let el: HTMLElement | null = element;
  while (el) {
    const mapId = el.getAttribute('data-map-id');
    if (mapId) {
      const t = getMapIdType(mapId);
      ids.push({ id: mapId, type: t, label: TYPE_LABELS[t] });
    }
    el = el.parentElement;
  }
  return ids.reverse();
}

/** Get React fiber from a DOM node (dev mode only) */
function getReactFiber(node: HTMLElement): any {
  const key = Object.keys(node).find(k => k.startsWith('__reactFiber$'));
  return key ? (node as any)[key] : null;
}

/** Walk React fiber tree to find the nearest component name and file path */
function getComponentInfo(element: HTMLElement): { name: string | null; filePath: string | null } {
  let fiber = getReactFiber(element);
  let domEl: HTMLElement | null = element;
  while (!fiber && domEl?.parentElement) {
    domEl = domEl.parentElement;
    fiber = getReactFiber(domEl);
  }

  let name: string | null = null;
  let filePath: string | null = null;

  while (fiber) {
    const fiberName = fiber.type?.displayName || fiber.type?.name;
    if (fiberName && typeof fiberName === 'string' && /^[A-Z]/.test(fiberName)) {
      if (!name) name = fiberName;
      if (fiber._debugSource) {
        filePath = fiber._debugSource.fileName || null;
        break;
      }
      if (fiber._debugOwner?._debugSource) {
        filePath = fiber._debugOwner._debugSource.fileName || null;
        break;
      }
    }
    fiber = fiber.return;
  }

  if (filePath) {
    const srcIdx = filePath.indexOf('src/');
    if (srcIdx !== -1) { filePath = filePath.substring(srcIdx); }
    else {
      const srcIdxBs = filePath.indexOf('src\\');
      if (srcIdxBs !== -1) filePath = filePath.substring(srcIdxBs).replace(/\\/g, '/');
    }
  }

  return { name, filePath };
}

/** Classify a DOM element into a semantic type */
function classifyElement(el: HTMLElement): { type: string; typeAr: string } {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');
  const cls = typeof el.className === 'string' ? el.className : '';

  if (tag === 'button' || role === 'button' || el.getAttribute('type') === 'submit')
    return { type: 'button', typeAr: ELEMENT_TYPE_AR.button };
  if (tag === 'a' || role === 'link')
    return { type: 'link', typeAr: ELEMENT_TYPE_AR.link };
  if (tag === 'input') {
    const t = el.getAttribute('type') || 'text';
    if (t === 'checkbox') return { type: 'checkbox', typeAr: ELEMENT_TYPE_AR.checkbox };
    if (t === 'radio') return { type: 'radio', typeAr: ELEMENT_TYPE_AR.radio };
    return { type: 'input', typeAr: ELEMENT_TYPE_AR.input };
  }
  if (tag === 'textarea') return { type: 'textarea', typeAr: ELEMENT_TYPE_AR.textarea };
  if (tag === 'select') return { type: 'select', typeAr: ELEMENT_TYPE_AR.select };
  if (role === 'switch' || cls.includes('switch'))
    return { type: 'switch', typeAr: ELEMENT_TYPE_AR.switch };
  if (role === 'tab' || role === 'tablist')
    return { type: 'tab', typeAr: ELEMENT_TYPE_AR.tab };
  if (tag === 'dialog' || role === 'dialog' || role === 'alertdialog')
    return { type: 'dialog', typeAr: ELEMENT_TYPE_AR.dialog };
  if (tag === 'img' || tag === 'picture')
    return { type: 'image', typeAr: ELEMENT_TYPE_AR.image };
  if (tag === 'svg' || cls.includes('lucide') || cls.includes('icon'))
    return { type: 'icon', typeAr: ELEMENT_TYPE_AR.icon };
  if (tag === 'nav' || role === 'navigation')
    return { type: 'nav', typeAr: ELEMENT_TYPE_AR.nav };
  if (cls.includes('sidebar') || role === 'complementary')
    return { type: 'sidebar', typeAr: ELEMENT_TYPE_AR.sidebar };
  if (cls.includes('card') || el.getAttribute('data-slot') === 'card')
    return { type: 'card', typeAr: ELEMENT_TYPE_AR.card };
  if (cls.includes('badge'))
    return { type: 'badge', typeAr: ELEMENT_TYPE_AR.badge };
  if (cls.includes('avatar'))
    return { type: 'avatar', typeAr: ELEMENT_TYPE_AR.avatar };
  if (tag === 'ul' || tag === 'ol')
    return { type: 'list', typeAr: ELEMENT_TYPE_AR.list };
  if (tag === 'li' || role === 'listitem' || role === 'menuitem')
    return { type: 'listItem', typeAr: ELEMENT_TYPE_AR.listItem };
  if (/^h[1-6]$/.test(tag))
    return { type: 'heading', typeAr: ELEMENT_TYPE_AR.heading };
  if (tag === 'form') return { type: 'form', typeAr: ELEMENT_TYPE_AR.form };
  if (tag === 'table' || role === 'grid' || role === 'table')
    return { type: 'table', typeAr: ELEMENT_TYPE_AR.table };
  if (tag === 'header') return { type: 'header', typeAr: ELEMENT_TYPE_AR.header };
  if (tag === 'footer') return { type: 'footer', typeAr: ELEMENT_TYPE_AR.footer };
  if (tag === 'section' || tag === 'article')
    return { type: 'section', typeAr: ELEMENT_TYPE_AR.section };
  if (role === 'menu' || role === 'listbox')
    return { type: 'dropdown', typeAr: ELEMENT_TYPE_AR.dropdown };
  if ((tag === 'p' || tag === 'span' || tag === 'label') && el.textContent?.trim())
    return { type: 'text', typeAr: ELEMENT_TYPE_AR.text };
  if (tag === 'div' || tag === 'main' || tag === 'aside')
    return { type: 'container', typeAr: ELEMENT_TYPE_AR.container };

  return { type: 'unknown', typeAr: ELEMENT_TYPE_AR.unknown };
}

/** Extract a human-readable label from the element */
function getElementLabel(el: HTMLElement): string {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  const title = el.getAttribute('title');
  if (title) return title;
  const placeholder = el.getAttribute('placeholder');
  if (placeholder) return placeholder;
  const alt = el.getAttribute('alt');
  if (alt) return alt;
  const text = el.textContent?.trim();
  if (text && text.length <= 50) return text;
  if (text && text.length > 50) return text.substring(0, 47) + '...';
  return '';
}

/** Generate a short CSS-like selector for the element */
function getElementSelector(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const classes = typeof el.className === 'string'
    ? el.className.split(/\s+/).filter(c => c && c.length < 30).slice(0, 2).map(c => `.${c}`).join('')
    : '';
  return `${tag}${id}${classes}`;
}

/** Full element analysis */
function analyzeElement(el: HTMLElement): ElementInfo {
  const { type, typeAr } = classifyElement(el);
  const { name: componentName, filePath } = getComponentInfo(el);
  return {
    element: el,
    componentName,
    filePath,
    elementType: type,
    elementTypeAr: typeAr,
    label: getElementLabel(el),
    selector: getElementSelector(el),
    mapIds: collectMapIds(el),
    rect: el.getBoundingClientRect(),
  };
}

/** Walk up to the nearest semantic container for Shift+Click group selection */
function findSemanticContainer(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el.parentElement;
  while (current) {
    const tag = current.tagName.toLowerCase();
    const role = current.getAttribute('role');
    const cls = typeof current.className === 'string' ? current.className : '';
    if (SEMANTIC_CONTAINERS.has(tag)) return current;
    if (role === 'navigation' || role === 'complementary' || role === 'dialog' || role === 'group') return current;
    if (cls.includes('card') || cls.includes('sidebar') || cls.includes('panel') || cls.includes('toolbar')) return current;
    if (current.getAttribute('data-map-id')) return current;
    current = current.parentElement;
  }
  return null;
}

/** Walk up N levels from base element */
function getElementAtDepth(base: HTMLElement, offset: number): HTMLElement {
  if (offset <= 0) return base;
  let el: HTMLElement | null = base;
  for (let i = 0; i < offset; i++) {
    if (el?.parentElement) el = el.parentElement;
    else break;
  }
  return el || base;
}

/** Generate prompt-ready text for copy */
function generatePromptText(info: ElementInfo, isGroup: boolean): string {
  const file = info.filePath ? info.filePath.split('/').pop() : null;
  const parts: string[] = [];
  if (file) parts.push(`في ملف ${file}`);
  if (info.componentName) parts.push(`الكومبوننت ${info.componentName}`);
  if (isGroup) {
    const childCount = info.element.querySelectorAll('*').length;
    parts.push(`${info.elementTypeAr} "${info.label}" (${info.selector}) — تحتوي ${childCount} عنصر`);
  } else {
    parts.push(info.label
      ? `${info.elementTypeAr} "${info.label}" (${info.selector})`
      : `${info.elementTypeAr} (${info.selector})`);
  }
  if (info.mapIds.length > 0) {
    parts.push(`Map: ${info.mapIds.map(i => `[${i.id}]`).join(' > ')}`);
  }
  return parts.join('، ');
}

// ─── Inspector UI check ─────────────────────────────────────────────

function isInspectorElement(el: HTMLElement | null): boolean {
  while (el) {
    if (el.getAttribute('data-dev-inspector') === 'true') return true;
    if (el.getAttribute('data-visual-editor') === 'true') return true;
    el = el.parentElement;
  }
  return false;
}

// ─── InfoRow sub-component ──────────────────────────────────────────

function InfoRow({ icon, label, value, mono }: { icon: string; label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #1f2937', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: '#6b7280', fontSize: 11, minWidth: 72, flexShrink: 0 }}>{label}</span>
      <span style={{
        color: '#e5e7eb', fontSize: 12, fontWeight: 500,
        fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all',
      }}>{value}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

/**
 * DevInspector — Precise element inspector with auto-detection.
 *
 * Works on ANY element (no data-map-id required).
 * Click = select single element, Shift+Click = select parent group.
 * Alt+Scroll = navigate depth (parent/child).
 * Ctrl+Shift+D to toggle.
 */
export function DevInspector() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('dev-inspector-enabled') === 'on'; }
    catch { return false; }
  });
  const [showFloatingButton, setShowFloatingButton] = useState(() => {
    try { return localStorage.getItem('dev-inspector-show') === 'on'; }
    catch { return false; }
  });
  const [hoveredInfo, setHoveredInfo] = useState<ElementInfo | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<ElementInfo | null>(null);
  const [isGroupSelection, setIsGroupSelection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [depthOffset, setDepthOffset] = useState(0);

  const baseHoveredRef = useRef<HTMLElement | null>(null);
  const lastTargetRef = useRef<HTMLElement | null>(null);
  const hoveredInfoRef = useRef<ElementInfo | null>(null);

  // Keep ref in sync with state (read during event handlers without stale closure)
  hoveredInfoRef.current = hoveredInfo;

  // ── Persist enabled state ──
  useEffect(() => {
    try { localStorage.setItem('dev-inspector-enabled', enabled ? 'on' : 'off'); }
    catch { /* noop */ }
  }, [enabled]);

  // ── Persist show floating button ──
  useEffect(() => {
    try { localStorage.setItem('dev-inspector-show', showFloatingButton ? 'on' : 'off'); }
    catch { /* noop */ }
  }, [showFloatingButton]);

  // ── Listen for settings page toggle event ──
  useEffect(() => {
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setEnabled(detail?.enabled ?? false);
    };
    window.addEventListener('devInspectorToggle', onToggle);
    return () => window.removeEventListener('devInspectorToggle', onToggle);
  }, []);

  // ── Listen for settings page show toggle event ──
  useEffect(() => {
    const onShowToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setShowFloatingButton(detail?.show ?? false);
    };
    window.addEventListener('devInspectorShowToggle', onShowToggle);
    return () => window.removeEventListener('devInspectorShowToggle', onShowToggle);
  }, []);

  // ── Keyboard shortcut: Ctrl+Shift+D ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setEnabled(prev => !prev);
        setSelectedInfo(null);
        setHoveredInfo(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Escape to close info panel ──
  useEffect(() => {
    if (!selectedInfo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setSelectedInfo(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedInfo]);

  // ── Clear state when disabled ──
  useEffect(() => {
    if (!enabled) {
      setSelectedInfo(null);
      setHoveredInfo(null);
      setDepthOffset(0);
      baseHoveredRef.current = null;
      lastTargetRef.current = null;
    }
  }, [enabled]);

  // ── Crosshair cursor style when enabled ──
  useEffect(() => {
    if (!enabled) return;
    const style = document.createElement('style');
    style.setAttribute('data-dev-inspector-style', 'true');
    style.textContent = [
      '.dev-inspector-active, .dev-inspector-active * { cursor: crosshair !important; }',
      '.dev-inspector-active [data-dev-inspector="true"] { cursor: default !important; }',
      '.dev-inspector-active [data-dev-inspector="true"] button { cursor: pointer !important; }',
    ].join('\n');
    document.head.appendChild(style);
    document.body.classList.add('dev-inspector-active');
    return () => {
      document.body.classList.remove('dev-inspector-active');
      style.remove();
    };
  }, [enabled]);

  // ── Update hover info when depth changes (Alt+Scroll) ──
  useEffect(() => {
    if (!enabled || !baseHoveredRef.current) return;
    const el = getElementAtDepth(baseHoveredRef.current, depthOffset);
    setHoveredInfo(analyzeElement(el));
  }, [depthOffset, enabled]);

  // ── Mouse move: hover highlight ──
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    const target = e.target as HTMLElement;
    if (isInspectorElement(target)) {
      setHoveredInfo(null);
      baseHoveredRef.current = null;
      lastTargetRef.current = null;
      return;
    }
    if (target !== lastTargetRef.current) {
      lastTargetRef.current = target;
      baseHoveredRef.current = target;
      setDepthOffset(0);
      setHoveredInfo(analyzeElement(target));
    }
  }, [enabled]);

  // ── Click: select element ──
  const handleClick = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    const target = e.target as HTMLElement;
    if (isInspectorElement(target)) return;

    e.preventDefault();
    e.stopPropagation();

    let elementToSelect = hoveredInfoRef.current?.element || target;

    if (e.shiftKey) {
      const container = findSemanticContainer(elementToSelect);
      if (container) elementToSelect = container;
      setIsGroupSelection(true);
    } else {
      setIsGroupSelection(false);
    }

    setSelectedInfo(analyzeElement(elementToSelect));
    setCopied(false);
  }, [enabled]);

  // ── Alt+Scroll: depth control ──
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!enabled || !baseHoveredRef.current) return;
    if (!e.altKey) return; // only intercept Alt+Scroll
    if (isInspectorElement(e.target as HTMLElement)) return;
    e.preventDefault();
    setDepthOffset(prev => Math.max(0, prev + (e.deltaY < 0 ? 1 : -1)));
  }, [enabled]);

  // ── Register/unregister event listeners ──
  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('wheel', handleWheel, true);
    };
  }, [enabled, handleMouseMove, handleClick, handleWheel]);

  // ── Copy for prompt ──
  const handleCopy = useCallback(async () => {
    if (!selectedInfo) return;
    const text = generatePromptText(selectedInfo, isGroupSelection);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-99999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setCopyError(null);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy prompt failed', err);
      setCopyError('فشل النسخ');
      setTimeout(() => setCopyError(null), 2000);
    }
  }, [selectedInfo, isGroupSelection]);

  // ── Computed values ──
  const hoverRect = hoveredInfo?.rect;
  const selectRect = selectedInfo ? selectedInfo.element.getBoundingClientRect() : null;
  const floatingLabel = hoveredInfo
    ? `${hoveredInfo.componentName || '?'} › ${hoveredInfo.elementTypeAr}${hoveredInfo.label ? ` "${hoveredInfo.label.substring(0, 25)}"` : ''}`
    : '';
  const depthIndicator = depthOffset > 0 ? ` ↑${depthOffset}` : '';

  // ── Render ──
  return (
    <>
      {/* ── Floating toggle button (visible when enabled) ── */}
      {showFloatingButton && (
        <div
          data-dev-inspector="true"
          title={enabled ? 'إيقاف خريطة المكونات (Ctrl+Shift+D)' : 'تفعيل خريطة المكونات (Ctrl+Shift+D)'}
          onClick={() => {
            setEnabled(prev => !prev);
            setSelectedInfo(null);
            setHoveredInfo(null);
          }}
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 100000,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: enabled ? '#3b82f6' : '#374151',
            border: `2px solid ${enabled ? '#60a5fa' : '#6b7280'}`,
            boxShadow: enabled
              ? '0 0 0 3px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.4)'
              : '0 2px 8px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          🗺️
        </div>
      )}

      {/* Hover highlight overlay */}
      {enabled && hoverRect && !selectedInfo && (
        <div data-dev-inspector="true" style={{
          position: 'fixed',
          top: hoverRect.top - 2,
          left: hoverRect.left - 2,
          width: hoverRect.width + 4,
          height: hoverRect.height + 4,
          border: '2px solid #3b82f6',
          borderRadius: 4,
          background: 'rgba(59, 130, 246, 0.06)',
          pointerEvents: 'none',
          zIndex: 99990,
          transition: 'all 0.05s ease-out',
        }}>
          {/* Floating label */}
          <span style={{
            position: 'absolute',
            top: -26,
            left: 0,
            background: '#3b82f6',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px 4px 0 0',
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 350,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            direction: 'ltr',
          }}>
            {floatingLabel}{depthIndicator}
          </span>
          {/* Size indicator */}
          <span style={{
            position: 'absolute',
            bottom: -18,
            right: 0,
            background: 'rgba(59, 130, 246, 0.85)',
            color: '#fff',
            fontSize: 9,
            padding: '1px 5px',
            borderRadius: '0 0 3px 3px',
            fontFamily: 'monospace',
            direction: 'ltr',
          }}>
            {Math.round(hoverRect.width)}×{Math.round(hoverRect.height)}
          </span>
        </div>
      )}

      {/* Selected element highlight */}
      {selectedInfo && selectRect && (
        <div data-dev-inspector="true" style={{
          position: 'fixed',
          top: selectRect.top - 3,
          left: selectRect.left - 3,
          width: selectRect.width + 6,
          height: selectRect.height + 6,
          border: `3px solid ${isGroupSelection ? '#f59e0b' : '#3b82f6'}`,
          borderRadius: 6,
          background: isGroupSelection ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
          pointerEvents: 'none',
          zIndex: 99990,
        }} />
      )}

      {/* Info panel (bottom-right) */}
      {selectedInfo && (
        <div data-dev-inspector="true" style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 99999,
          width: 370,
          background: '#1f2937',
          border: `1px solid ${isGroupSelection ? '#f59e0b' : '#374151'}`,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          direction: 'ltr',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid #374151',
            background: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
              🔍 {isGroupSelection ? 'Group Inspector' : 'Element Inspector'}
            </span>
            <button
              data-dev-inspector="true"
              onClick={() => setSelectedInfo(null)}
              style={{
                background: 'none', border: 'none', color: '#6b7280',
                fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
              }}
            >✕</button>
          </div>

          {/* Details */}
          <div style={{ padding: '10px 14px' }}>
            {selectedInfo.filePath && (
              <InfoRow icon="📁" label="File" value={selectedInfo.filePath} mono />
            )}
            {selectedInfo.componentName && (
              <InfoRow icon="🧩" label="Component" value={selectedInfo.componentName} />
            )}
            <InfoRow
              icon="🏷️"
              label="Element"
              value={`${selectedInfo.elementTypeAr}${selectedInfo.label ? ` — "${selectedInfo.label}"` : ''}`}
            />
            <InfoRow
              icon="📐"
              label="Size"
              value={`${Math.round(selectedInfo.rect.width)}×${Math.round(selectedInfo.rect.height)}px`}
            />
            <InfoRow icon="🎯" label="Selector" value={selectedInfo.selector} mono />
            {selectedInfo.mapIds.length > 0 && (
              <InfoRow
                icon="🗺️"
                label="Map"
                value={selectedInfo.mapIds.map(i => `[${i.id}]`).join(' > ')}
                mono
              />
            )}
            {isGroupSelection && (
              <InfoRow
                icon="📦"
                label="Children"
                value={`${selectedInfo.element.querySelectorAll('*').length} عنصر`}
              />
            )}
          </div>

          {/* Copy for Prompt button */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid #374151', background: '#111827' }}>
            <button
              data-dev-inspector="true"
              onClick={handleCopy}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: copied ? '#10b981' : '#3b82f6',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {copied ? '✅ تم النسخ!' : '📋 نسخ للبرومبت'}
            </button>
            {copyError && (
              <div style={{ marginTop: 8, color: '#f87171', fontSize: 11, fontWeight: 600 }}>
                {copyError}
              </div>
            )}
          </div>

          {/* Usage hints */}
          <div style={{ padding: '6px 14px', borderTop: '1px solid #374151', background: '#0d1117' }}>
            <p style={{ color: '#4b5563', fontSize: 10, margin: 0, lineHeight: 1.6, direction: 'ltr' }}>
              Click = element · Shift+Click = group · Alt+Scroll = depth · Esc = close
            </p>
          </div>
        </div>
      )}
    </>
  );
}

