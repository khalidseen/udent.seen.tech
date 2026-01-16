import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = 'https://lxusbjpvcyjcfrnyselc.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Simple query to keep the database active
    const { data: pingResult, error: pingError } = await supabase
      .from('system_health_pings')
      .insert({
        ping_type: 'keep_alive',
        source: 'edge_function',
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: req.headers.get('user-agent') || 'unknown'
        }
      })
      .select('id, created_at')
      .single()

    if (pingError) {
      console.error('Ping insert error:', pingError)
      
      // Fallback: just do a simple SELECT to keep DB active
      const { error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (selectError) {
        throw selectError
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Database pinged (fallback)',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Keep-alive ping successful:', pingResult)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database keep-alive successful',
        ping_id: pingResult?.id,
        timestamp: pingResult?.created_at || new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Keep-alive error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
