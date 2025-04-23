import { createClient } from '../../../../node_modules/@supabase/supabase-js/dist/module/index.js'
import { NextResponse } from 'next/server'
import type { ServiceTask } from '@/lib/supabase'

interface TaskInput {
  request_type: 'ROOM_SERVICE' | 'DINING_BOOKING' | 'SPA_BOOKING'
  guest_phone_number: string
  room_no: string
  request_details?: string
}

export async function POST(request: Request) {
  const supabase = createClient<ServiceTask>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const data: TaskInput = await request.json()

  // Validate required fields
  if (!data.request_type || !data.guest_phone_number || !data.room_no) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Insert new task with default status
  const { data: newTask, error } = await supabase
    .from('service_tasks')
    .insert([{
      request_type: data.request_type,
      guest_phone_number: data.guest_phone_number,
      room_no: data.room_no,
      request_details: data.request_details || '',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notified_on_completion: false
    }])
    .select()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(newTask[0], { status: 201 })
}
