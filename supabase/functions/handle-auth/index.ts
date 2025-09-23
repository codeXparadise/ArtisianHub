import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userData } = await req.json()

    switch (action) {
      case 'createUser':
        const { data: newUser, error: userError } = await supabaseClient
          .from('users')
          .insert([userData])
          .select()
          .single()

        if (userError) throw userError

        // Create artisan profile if needed
        if (userData.is_artisan) {
          const { error: artisanError } = await supabaseClient
            .from('artisans')
            .insert([{
              user_id: newUser.id,
              business_name: userData.full_name,
              craft_specialty: userData.craft_specialty || 'General'
            }])

          if (artisanError) throw artisanError
        }

        return new Response(
          JSON.stringify({ success: true, data: newUser }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'updateUser':
        const { data: updatedUser, error: updateError } = await supabaseClient
          .from('users')
          .update(userData.updates)
          .eq('id', userData.userId)
          .select()
          .single()

        if (updateError) throw updateError

        return new Response(
          JSON.stringify({ success: true, data: updatedUser }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})