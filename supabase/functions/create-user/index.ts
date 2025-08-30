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
    console.log('Starting user creation process...');
    
    // Create admin client with service role
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

    console.log('Admin client created successfully');

    const requestBody = await req.json();
    console.log('Request body received:', { 
      email: requestBody.email, 
      hasPassword: !!requestBody.password,
      fullName: requestBody.fullName,
      role: requestBody.role 
    });

    const { email, password, fullName, role, phone, notes } = requestBody;

    // Validate input
    if (!email || !password || !fullName || !role) {
      console.log('Validation failed: missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, fullName, and role are required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Validation passed, creating user...');

    // Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm for admin-created users
      user_metadata: {
        full_name: fullName,
        role: role,
        phone: phone || '',
        notes: notes || ''
      }
    });

    if (authError) {
      console.error('Auth creation failed:', authError);
      return new Response(
        JSON.stringify({ 
          error: authError.message,
          code: authError.code || 'auth_error'
        }), 
        { 
          status: authError.status || 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authData.user) {
      console.error('User creation returned no user data');
      return new Response(
        JSON.stringify({ error: 'Failed to create user - no user data returned' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Auth user created successfully, ID:', authData.user.id);

    // Small delay to ensure trigger completion
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create profile explicitly to ensure it exists
    console.log('Creating profile...');
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
      console.warn('Profile creation warning (may be handled by trigger):', profileError);
      // Don't fail the request if profile creation fails - trigger might handle it
    } else {
      console.log('Profile created/updated successfully');
    }

    console.log('User creation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          role: role
        }
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in user creation:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Unknown error occurred'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});