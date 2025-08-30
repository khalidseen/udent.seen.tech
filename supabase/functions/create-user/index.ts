import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, password, fullName, role, phone, notes } = await req.json();

    console.log('Creating user with:', { email, fullName, role });

    // Validate input
    if (!email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, fullName, role' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users?.find(u => u.email === email);
    
    if (userExists) {
      return new Response(
        JSON.stringify({ error: 'A user with this email address has already been registered' }), 
        { 
          status: 422, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create user in Auth with email confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // تأكيد البريد الإلكتروني تلقائياً
      user_metadata: {
        full_name: fullName,
        role: role,
        phone: phone || '',
        notes: notes || ''
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          error: authError.message || 'Database error creating new user',
          details: authError 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user - no user data returned' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User created successfully:', authData.user.id);

    // Create profile explicitly (في حالة لم يتم تشغيل trigger)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          user_id: authData.user.id,
          full_name: fullName,
          role: role,
          status: 'approved'
        }
      ], { 
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Profile creation error (non-fatal):', profileError);
      // لا نفشل العملية إذا فشل إنشاء الملف الشخصي لأن trigger قد يكون تولى الأمر
    }

    console.log('Profile created/updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          role: role,
          created_at: authData.user.created_at
        }
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    let errorMessage = 'Internal server error';
    let status = 500;
    
    if (error.message) {
      if (error.message.includes('already registered')) {
        errorMessage = 'A user with this email address has already been registered';
        status = 422;
      } else if (error.message.includes('email')) {
        errorMessage = 'Invalid email address';
        status = 400;
      } else if (error.message.includes('password')) {
        errorMessage = 'Password does not meet security requirements';
        status = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.toString()
      }), 
      { 
        status: status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});