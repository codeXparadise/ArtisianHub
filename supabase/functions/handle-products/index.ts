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

    const { action, productData, filters } = await req.json()

    switch (action) {
      case 'createProduct':
        const { data: newProduct, error: productError } = await supabaseClient
          .from('products')
          .insert([productData])
          .select(`
            *,
            artisans (
              business_name,
              user_id
            )
          `)
          .single()

        if (productError) throw productError

        return new Response(
          JSON.stringify({ success: true, data: newProduct }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'getProducts':
        let query = supabaseClient
          .from('products')
          .select(`
            *,
            artisans (
              business_name,
              user_id,
              rating
            )
          `)

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }
        if (filters?.category) {
          query = query.eq('category', filters.category)
        }
        if (filters?.artisan_id) {
          query = query.eq('artisan_id', filters.artisan_id)
        }
        if (filters?.featured) {
          query = query.eq('featured', filters.featured)
        }

        query = query.order('created_at', { ascending: false })

        if (filters?.limit) {
          query = query.limit(filters.limit)
        }

        const { data: products, error: fetchError } = await query

        if (fetchError) throw fetchError

        return new Response(
          JSON.stringify({ success: true, data: products || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'updateProduct':
        const { data: updatedProduct, error: updateError } = await supabaseClient
          .from('products')
          .update(productData.updates)
          .eq('id', productData.productId)
          .select()
          .single()

        if (updateError) throw updateError

        return new Response(
          JSON.stringify({ success: true, data: updatedProduct }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'deleteProduct':
        const { error: deleteError } = await supabaseClient
          .from('products')
          .delete()
          .eq('id', productData.productId)

        if (deleteError) throw deleteError

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