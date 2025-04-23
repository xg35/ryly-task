'use client'

import { useState, useEffect } from 'react'
import { supabase, ServiceTask } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function ServiceTasksPage() {
  const [tasks, setTasks] = useState<ServiceTask[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState<Partial<ServiceTask>>({
    request_type: 'ROOM_SERVICE',
    status: 'PENDING'
  })

  useEffect(() => {
    fetchTasks()

    // Set up real-time subscription
    const channel = supabase
      .channel('service_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_tasks'
        },
        () => fetchTasks()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase fetch error:', error)
        throw new Error(`Failed to fetch tasks: ${error.message}`)
      }
      console.log('Fetched tasks from Supabase:', data)
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      // Show error to user
      alert(`Error loading tasks: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!newTask.guest_phone_number || !newTask.request_details) {
        throw new Error('Phone number and description are required')
      }

      const { error } = await supabase
        .from('service_tasks')
        .insert([{
          request_type: newTask.request_type,
          guest_phone_number: newTask.guest_phone_number,
          room_no: newTask.room_no,
          request_details: newTask.request_details,
          guest_name: newTask.guest_name,
          status: 'PENDING' // Always set to PENDING for new tasks
        }])

      if (error) {
        console.error('Supabase insert error:', error)
        throw new Error(`Failed to create task: ${error.message}`)
      }

      alert('Task created successfully!')
      setNewTask({
        request_type: 'ROOM_SERVICE',
        status: 'PENDING'
      })
      await fetchTasks()
    } catch (error) {
      console.error('Error creating task:', error)
      alert(`Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTask(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Service Tasks</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Request Type</label>
                <Select
                  value={newTask.request_type}
                  onValueChange={(value) => setNewTask(prev => ({
                    ...prev,
                    request_type: value as ServiceTask['request_type']
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROOM_SERVICE">Room Service</SelectItem>
                    <SelectItem value="DINING_BOOKING">Dining Booking</SelectItem>
                    <SelectItem value="SPA_BOOKING">Spa Booking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Room Number</label>
                <Input
                  name="room_no"
                  value={newTask.room_no || ''}
                  onChange={handleInputChange}
                  placeholder="Room number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Requestor (Guest Name)</label>
                <Input
                  name="guest_name"
                  value={newTask.guest_name || ''}
                  onChange={handleInputChange}
                  placeholder="Guest name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input
                  name="guest_phone_number"
                  value={newTask.guest_phone_number || ''}
                  onChange={handleInputChange}
                  placeholder="Guest phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  name="request_details"
                  value={newTask.request_details || ''}
                  onChange={handleInputChange}
                  placeholder="Request details"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Create Task
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p>No tasks found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.room_no || '-'}</TableCell>
                      <TableCell>{task.guest_name || '-'}</TableCell>
                      <TableCell>{task.request_type}</TableCell>
                      <TableCell>{task.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
