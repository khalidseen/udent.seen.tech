import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';

// ── Types ─────────────────────────────────────────────────────
export type EditableSource = 'branding' | 'translation' | 'db';
export type EditableField = 'text' | 'image';

export interface EditTarget {
  source: EditableSource;
  key: string;
  field: EditableField;
  id?: string;         // row UUID for db source
  table?: string;      // table name for db source
  column?: string;     // column name for db source
  currentValue: string;
}

interface VisualEditorContextValue {
  isEditorEnabled: boolean;
  isEditing: boolean;
  editTarget: EditTarget | null;
  canEdit: boolean;
  startEdit: (element: HTMLElement) => void;
  saveEdit: (newValue: string) => Promise<void>;
  cancelEdit: () => void;
  setEditorEnabled: (enabled: boolean) => void;
}

const VisualEditorContext = createContext<VisualEditorContextValue>({
  isEditorEnabled: false,
  isEditing: false,
  editTarget: null,
  canEdit: false,
  startEdit: () => {},
  saveEdit: async () => {},
  cancelEdit: () => {},
  setEditorEnabled: () => {},
});

// ── Parse data-editable-* from a DOM element ──────────────────
function parseEditableAttributes(el: HTMLElement): EditTarget | null {
  const source = el.getAttribute('data-editable-type') as EditableSource | null;
  const key = el.getAttribute('data-editable-key');
  if (!source || !key) return null;

  const field = (el.getAttribute('data-editable-field') || 'text') as EditableField;
  const id = el.getAttribute('data-editable-id') || undefined;
  const table = el.getAttribute('data-editable-table') || undefined;
  const column = el.getAttribute('data-editable-column') || undefined;

  // Extract current value: for images use src, for text use textContent
  let currentValue = '';
  if (field === 'image') {
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    currentValue = (img as HTMLImageElement)?.src || '';
  } else {
    currentValue = el.textContent?.trim() || '';
  }

  return { source, key, field, id, table, column, currentValue };
}

// ── Provider ──────────────────────────────────────────────────
export function VisualEditorProvider({ children }: { children: React.ReactNode }) {
  const { hasPermission } = usePermissions();

  const [isEditorEnabled, setEditorEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const editElementRef = useRef<HTMLElement | null>(null);

  // Permission: hasPermission already returns true for system admins
  const canEdit = hasPermission('settings.manage');

  // Listen for toggle event from settings
  useEffect(() => {
    const saved = localStorage.getItem('visualEditorEnabled');
    if (saved === 'true' && canEdit) setEditorEnabled(true);

    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (canEdit) setEditorEnabled(detail?.enabled ?? false);
    };
    window.addEventListener('visualEditorToggle', onToggle);
    return () => window.removeEventListener('visualEditorToggle', onToggle);
  }, [canEdit]);

  const startEdit = useCallback((element: HTMLElement) => {
    if (!canEdit) return;
    const target = parseEditableAttributes(element);
    if (!target) return;
    editElementRef.current = element;
    setEditTarget(target);
    setIsEditing(true);
  }, [canEdit]);

  const saveEdit = useCallback(async (newValue: string) => {
    if (!editTarget || !canEdit) return;

    const { source, field } = editTarget;

    if (source === 'translation') {
      // Save to translation_overrides table
      const lang = document.documentElement.lang || 'ar';
      await supabase.from('translation_overrides' as any).upsert(
        { language: lang, key: editTarget.key, value: newValue },
        { onConflict: 'language,key' }
      );
      // Dispatch event so LanguageContext can refresh
      window.dispatchEvent(new CustomEvent('translationOverrideChanged', { detail: { key: editTarget.key, value: newValue, language: lang } }));
    } else if (source === 'db') {
      const { table, column, id } = editTarget;
      if (table && column && id) {
        await supabase.from(table as any).update({ [column]: newValue }).eq('id', id);
      }
    }

    // Update DOM immediately for visual feedback
    if (editElementRef.current) {
      if (field === 'text') {
        editElementRef.current.textContent = newValue;
      }
    }

    setIsEditing(false);
    setEditTarget(null);
    editElementRef.current = null;
  }, [editTarget, canEdit]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditTarget(null);
    editElementRef.current = null;
  }, []);

  return (
    <VisualEditorContext.Provider value={{
      isEditorEnabled,
      isEditing,
      editTarget,
      canEdit,
      startEdit,
      saveEdit,
      cancelEdit,
      setEditorEnabled,
    }}>
      {children}
    </VisualEditorContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useVisualEditor() {
  return useContext(VisualEditorContext);
}
