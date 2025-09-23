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

    const { action, cartData } = await req.json()

    switch (action) {
      case 'addToCart':
        // Check if item already exists
        const { data: existing } = await supabaseClient
          .from('cart_items')
          .select('*')
          .eq('user_id', cartData.user_id)
          .eq('product_id', cartData.product_id)
          .single()

        if (existing) {
          // Update quantity
          const { data: updated, error: updateError } = await supabaseClient
            .from('cart_items')
            .update({ quantity: existing.quantity + (cartData.quantity || 1) })
            .eq('id', existing.id)
            .select()
            .single()

          if (updateError) throw updateError
          return new Response(
            JSON.stringify({ success: true, data: updated }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Insert new item
          const { data: newItem, error: insertError } = await supabaseClient
            .from('cart_items')
            .insert([cartData])
            .select()
            .single()

          if (insertError) throw insertError
          return new Response(
            JSON.stringify({ success: true, data: newItem }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      case 'getCart':
        const { data: cartItems, error: fetchError } = await supabaseClient
          .from('cart_items')
          .select(`
            *,
            products (
              id,
              title,
              price,
              images,
              artisans (
                business_name
              )
            )
          `)
          .eq('user_id', cartData.user_id)

        if (fetchError) throw fetchError

        return new Response(
          JSON.stringify({ success: true, data: cartItems || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'updateCartItem':
        const { data: updatedItem, error: updateCartError } = await supabaseClient
          .from('cart_items')
          .update({ quantity: cartData.quantity })
          .eq('user_id', cartData.user_id)
          .eq('product_id', cartData.product_id)
          .select()
          .single()

        if (updateCartError) throw updateCartError

        return new Response(
          JSON.stringify({ success: true, data: updatedItem }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'removeFromCart':
        const { error: removeError } = await supabaseClient
          .from('cart_items')
          .delete()
          .eq('user_id', cartData.user_id)
          .eq('product_id', cartData.product_id)

        if (removeError) throw removeError

        return new Response(
          JSON.stringify({ success: true }),
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