import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add rate limiting - max 10 requests per minute per IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || 'unknown';
  
  // Basic rate limiting (in production, use Redis or similar)
  // For now, we'll just log the request for monitoring
  console.log(`Rate limiting check for IP: ${clientIp} at ${new Date().toISOString()}`);

  try {
    // Extract client IP and user agent from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent') || '';
    
    // Get the client IP (prefer x-forwarded-for for load balancers, fallback to x-real-ip)
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || 'unknown';
    
    console.log(`Client info request from IP: ${clientIp}, User Agent: ${userAgent}`);
    
    return new Response(
      JSON.stringify({
        ip: clientIp,
        userAgent: userAgent,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error getting client info:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500,
      },
    )
  }
})