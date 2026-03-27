import { supabase } from '@/integrations/supabase/client';

export interface InventoryItem {
  id: string;
  clinic_id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number;
  supplier?: string | null;
  supplier_contact?: string | null;
  batch_number?: string | null;
  brand?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InventoryCreateInput {
  name: string;
  category?: string;
  unit?: string;
  current_stock?: number;
  minimum_stock?: number;
  unit_cost?: number;
  supplier?: string;
  supplier_contact?: string;
  batch_number?: string;
  brand?: string;
  expiry_date?: string;
  notes?: string;
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
}

async function getClinicId(): Promise<string> {
  const { data } = await supabase.rpc('get_current_user_profile');
  if (!data?.id) throw new Error('لا يمكن تحديد العيادة الحالية');
  return data.id;
}

export const inventoryService = {
  async getAll(filters: InventoryFilters = {}): Promise<InventoryItem[]> {
    const clinicId = await getClinicId();
    let query = supabase
      .from('medical_supplies')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name');

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,category.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
    }
    if (filters.category) query = query.eq('category', filters.category);

    const { data, error } = await query;
    if (error) throw error;

    let items = (data as unknown as InventoryItem[]) || [];

    if (filters.lowStock) {
      items = items.filter(item => item.current_stock <= item.minimum_stock);
    }
    if (filters.expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      items = items.filter(item => item.expiry_date && new Date(item.expiry_date) <= thirtyDaysFromNow);
    }

    return items;
  },

  async getById(id: string): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('medical_supplies')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as InventoryItem;
  },

  async create(input: InventoryCreateInput): Promise<InventoryItem> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('medical_supplies')
      .insert({
        clinic_id: clinicId,
        name: input.name,
        category: input.category || 'عام',
        unit: input.unit || 'قطعة',
        current_stock: input.current_stock ?? 0,
        minimum_stock: input.minimum_stock ?? 5,
        unit_cost: input.unit_cost ?? 0,
        supplier: input.supplier,
        supplier_contact: input.supplier_contact,
        batch_number: input.batch_number,
        brand: input.brand,
        expiry_date: input.expiry_date,
        notes: input.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as InventoryItem;
  },

  async update(id: string, input: Partial<InventoryCreateInput>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('medical_supplies')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as InventoryItem;
  },

  async adjustQuantity(id: string, adjustment: number, reason?: string): Promise<void> {
    const clinicId = await getClinicId();

    const { data: item } = await supabase
      .from('medical_supplies')
      .select('current_stock')
      .eq('id', id)
      .single();

    if (!item) throw new Error('العنصر غير موجود');

    const newQuantity = item.current_stock + adjustment;
    if (newQuantity < 0) throw new Error('الكمية لا يمكن أن تكون سالبة');

    const { error } = await supabase
      .from('medical_supplies')
      .update({ current_stock: newQuantity })
      .eq('id', id);
    if (error) throw error;

    await supabase.from('stock_movements').insert({
      clinic_id: clinicId,
      supply_id: id,
      quantity: Math.abs(adjustment),
      movement_type: adjustment > 0 ? 'in' : 'out',
      notes: reason || (adjustment > 0 ? 'إضافة مخزون' : 'سحب مخزون'),
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('medical_supplies')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async getCategories(): Promise<string[]> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('medical_supplies')
      .select('category')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);
    if (error) throw error;
    return [...new Set((data || []).map(d => d.category).filter(Boolean))];
  },

  async getLowStockAlerts(): Promise<InventoryItem[]> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('medical_supplies')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);
    if (error) throw error;
    return ((data || []) as unknown as InventoryItem[]).filter(item => item.current_stock <= item.minimum_stock);
  },

  async getStats(): Promise<{
    totalItems: number;
    lowStockCount: number;
    expiringCount: number;
    totalValue: number;
  }> {
    const clinicId = await getClinicId();
    const { data, error } = await supabase
      .from('medical_supplies')
      .select('current_stock, minimum_stock, unit_cost, expiry_date')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);
    if (error) throw error;

    const items = data || [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return {
      totalItems: items.length,
      lowStockCount: items.filter(i => i.current_stock <= i.minimum_stock).length,
      expiringCount: items.filter(i => i.expiry_date && new Date(i.expiry_date) <= thirtyDaysFromNow).length,
      totalValue: items.reduce((s, i) => s + (i.current_stock * (i.unit_cost || 0)), 0),
    };
  },
};
