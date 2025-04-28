// components/taskdashboard.tsx

"use client";

import { useEffect, useState } from 'react';
import { getCurrentLocation, hasLocationPermission, watchUserPosition, clearPositionWatch } from '@/services/geolocation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from 'lucide-react';
// Removed UserLocation import as it's no longer needed
import { supabase } from '@/lib/supabase';
// Removed dynamic import
import Task from './Task';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
// Removed 'leaflet/dist/leaflet.css' import

// Interface for the local state representation of a task
interface TaskItem {
  id: string;
  description: string;
  room_no: string;
  requestor: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
}

// Interface for the data needed to create a new task via the form
interface NewTaskData {
  description: string;
  room_no: string;
  requestor: string;
}

// Removed dynamically imported Leaflet components

const TaskDashboard = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationAllowed, setLocationAllowed] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Check and request location permission
  const updateUserLocation = async (location: {lat: number, lng: number}) => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          coordinates: `POINT(${location.lng} ${location.lat})`,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  };

  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        const hasPermission = await hasLocationPermission();
        setLocationAllowed(hasPermission);
        
        if (hasPermission) {
          const location = await getCurrentLocation();
          setCurrentLocation(location);
          await updateUserLocation(location);

          // Start periodic tracking
          const watchId = watchUserPosition(async (loc) => {
            setCurrentLocation(loc);
            await updateUserLocation(loc);
          }, 15000);
          setLocationWatchId(watchId);
        }
      } catch (error) {
        console.error('Location permission error:', error);
        setLocationAllowed(false);
      }
    };

    checkLocationPermission();

    return () => {
      if (locationWatchId !== null) {
        clearPositionWatch(locationWatchId);
      }
    };
  }, []);

  // Fetch initial tasks and set up real-time listener
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true); // Set loading true at the start of initial fetch

        const { data, error } = await supabase
          .from('service_tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Supabase fetch error:", error);
          throw error;
        }

        setTasks(data?.map((task: any) => ({
          id: task.id,
          description: task.request_details ?? 'No Description',
          room_no: task.room_no ?? 'N/A',
          requestor: task.guest_name ?? 'Unknown',
          status: task.status === 'IN_PROGRESS' ? 'IN_PROGRESS' :
                 task.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          created_at: task.created_at
        })) || []);

      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error Fetching Tasks",
          description: "Could not load tasks from the database.",
          variant: "destructive",
        });
      } finally {
        // Keep loading false logic
        setLoading(false);
      }
    };

    fetchTasks();

    const channel = supabase
      .channel('service_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_tasks'
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchTasks(); // Refetch on changes
        }
      )
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') {
           console.log('Subscribed to service_tasks changes!');
         }
         if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Subscription error:', status, err);
            toast({
               title: "Real-time Error",
               description: "Connection to live updates failed. Refresh may be needed.",
               variant: "destructive",
            });
         }
      });

    return () => {
      console.log('Removing channel subscription');
      supabase.removeChannel(channel).catch(err => console.error("Error removing channel", err));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed useEffect for fetching user locations

  // Removed useEffect for location tracking

  // --- Handler Functions (Keep handleAcceptTask, handleCompleteTask, handleCreateTask) ---

  const handleAcceptTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({
          status: 'IN_PROGRESS',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Optimistic update (optional)
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'IN_PROGRESS' } : t
      ));

      toast({
        title: "Task Accepted",
        description: "Status updated to IN_PROGRESS.",
      });

    } catch (error: any) {
      console.error('Error accepting task:', error);
      toast({
        title: "Error Accepting Task",
        description: `Failed to update task status. ${error.message || 'Check console.'}`,
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
     try {
      const { error } = await supabase
        .from('service_tasks')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Optimistic update
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'COMPLETED' } : t
      ));

      toast({
        title: "Task Completed",
        description: "Status updated to COMPLETED.",
      });

    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: "Error Completing Task",
        description: `Failed to update task status. ${error.message || 'Check console.'}`,
        variant: "destructive",
      });
    }
  };

 const handleCreateTask = async (newTaskData: NewTaskData) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .insert([{
          request_type: 'ROOM_SERVICE', // Adjust if needed
          request_details: newTaskData.description,
          room_no: newTaskData.room_no,
          guest_name: newTaskData.requestor,
          status: 'PENDING',
          notified_on_completion: false // Default if needed
        }]);

      if (error) throw error;

      toast({
        title: "Task Created",
        description: "New task added successfully.",
      });
      setIsCreateDialogOpen(false); // Close dialog

    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error Creating Task",
        description: `Failed to create task. ${error.message || 'Check console.'}`,
        variant: "destructive",
      });
    }
  };

  // --- Filtering Logic (Keep as is) ---
  const pendingTasks = tasks.filter(task => task.status === 'PENDING');
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED');
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS');

  // --- Render Logic ---
  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        {locationAllowed === false && (
          <div className="text-sm text-red-500">
            Location access is required for some features. Please enable location permissions in your browser settings.
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Switch
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={(checked) => setShowCompleted(checked)}
            aria-label="Show completed tasks"
          />
          <Label htmlFor="show-completed">Show Completed Tasks (TEST)</Label>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
              <DialogDescription>
                Enter the details for the new service request. Click create when done.
              </DialogDescription>
            </DialogHeader>
            <TaskForm onCreateTask={handleCreateTask} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Columns (Keep as is) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PENDING Column */}
        <Card>
          <CardHeader>
            <CardTitle>PENDING ({pendingTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <Task
                  key={task.id}
                  task={task}
                  onAcceptTask={handleAcceptTask}
                  onCompleteTask={handleCompleteTask}
                />
              ))
            ) : (
              <p className="text-muted-foreground italic text-sm">No pending tasks</p>
            )}
          </CardContent>
        </Card>

        {/* IN PROGRESS Column */}
        <Card>
          <CardHeader>
            <CardTitle>In Progress ({inProgressTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => (
                <Task
                  key={task.id}
                  task={task}
                  onAcceptTask={handleAcceptTask}
                  onCompleteTask={handleCompleteTask}
                />
              ))
            ) : (
              <p className="text-muted-foreground italic text-sm">No tasks currently in progress</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Removed Map Section */}

      {/* COMPLETED Section (Conditional - Keep as is) */}
      {showCompleted && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>COMPLETED ({completedTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <Task
                  key={task.id}
                  task={task}
                  onAcceptTask={() => {}} // No-op
                  onCompleteTask={() => {}} // No-op
                />
              ))
            ) : (
              <p className="text-muted-foreground italic text-sm">No completed tasks to show</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// --- TaskForm Component (Keep as is) ---
interface TaskFormProps {
  onCreateTask: (newTaskData: NewTaskData) => void;
}

const TaskForm = ({ onCreateTask }: TaskFormProps) => {
  const [description, setDescription] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [requestor, setRequestor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();

    if (description.trim() && roomNo.trim() && requestor.trim()) {
      onCreateTask({
        description: description.trim(),
        room_no: roomNo.trim(),
        requestor: requestor.trim(),
      });
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields (Description, Room Number, Requestor).",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right col-span-1">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="col-span-3"
          placeholder="e.g., Need extra towels"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="roomNo" className="text-right col-span-1">
          Room No.
        </Label>
        <Input
          type="text"
          id="roomNo"
          value={roomNo}
          onChange={(e) => setRoomNo(e.target.value)}
          className="col-span-3"
          placeholder="e.g., 101"
          required
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="requestor" className="text-right col-span-1">
          Requestor
        </Label>
        <Input
          type="text"
          id="requestor"
          value={requestor}
          onChange={(e) => setRequestor(e.target.value)}
          className="col-span-3"
          placeholder="Guest Name"
          required
        />
      </div>
      <Button onClick={handleSubmit} type="button" className="w-full mt-2">
        Create Task
      </Button>
    </div>
  );
};

export default TaskDashboard;
