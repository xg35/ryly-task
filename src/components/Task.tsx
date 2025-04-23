// components/Task.tsx

"use client";

// No need for useState, useEffect, supabase, or User from supabase/supabase-js here
// as we removed the assignee/current user logic.

import { Button } from "@/components/ui/button";
import { formatTimeSince } from "@/lib/utils";
import { toast } from "@/hooks/use-toast"; // Keep toast for potential future use or if handlers inside did something complex
import { MapPinIcon, CheckCheckIcon, UserIcon, InfoIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import if you want an explicit close button
} from "@/components/ui/dialog";
import GuestGreeting from './GuestGreeting'; // Assuming this component exists

// Interface matching the data passed from TaskDashboard
interface TaskItem {
  id: string;
  description: string;
  room_no: string;
  requestor: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  // assignee is removed
}

// Props for the Task component
interface TaskProps {
  task: TaskItem;
  onAcceptTask: (taskId: string) => void; // Callback function
  onCompleteTask: (taskId: string) => void; // Callback function
}

const Task = ({ task, onAcceptTask, onCompleteTask }: TaskProps) => {

  // Simple handler functions that call the props passed from the parent
  const handleAccept = () => {
    // Optional: Add any client-side validation or confirmation here if needed
    onAcceptTask(task.id);
    // Consider closing the dialog after accepting, if desired.
    // This requires managing dialog state or using DialogClose with the button.
  };

  const handleComplete = () => {
    // Optional: Add any client-side validation or confirmation here if needed
    onCompleteTask(task.id);
    // Consider closing the dialog after completing.
  };

  // Determine card background based on status (optional styling)
  const cardBgClass = task.status === 'PENDING' ? 'bg-secondary hover:bg-accent' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50' :
                      'bg-muted hover:bg-muted/80'; // Completed or other statuses

  return (
    <Dialog>
      {/* The visible card in the dashboard column */}
      <DialogTrigger asChild>
        <div className={`rounded-md p-4 flex flex-col gap-2 cursor-pointer transition-colors duration-150 ${cardBgClass}`}>
          <h3 className="font-semibold text-base">{task.description}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
            <span>{task.room_no}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4 flex-shrink-0" />
            <span>{task.requestor}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{formatTimeSince(task.created_at)}</span>
          </div>
           {/* Optional: Small status indicator */}
           {/* <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${
              task.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
              task.status === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-800' :
              'bg-green-200 text-green-800'
            }`}>
              {task.status}
           </div> */}
        </div>
      </DialogTrigger>

      {/* The Dialog content shown when the card is clicked */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
          <DialogDescription>
            Review the request details and update the status.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Task Information Sections */}
          <div className="space-y-1 border-b pb-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><InfoIcon className="h-4 w-4"/> Request Info</h4>
            <p><span className="font-semibold">Description:</span> {task.description}</p>
            <p><span className="font-semibold">Room:</span> {task.room_no}</p>
            <p><span className="font-semibold">Requestor:</span> {task.requestor}</p>
            <p><span className="font-semibold">Status:</span> {task.status}</p>
            <p><span className="font-semibold">Created:</span> {formatTimeSince(task.created_at)}</p>
          </div>

          {/* Guest Greeting Component */}
          <div className="border-b pb-3">
             <GuestGreeting task={task} />
          </div>


          {/* Action Buttons - Conditionally Rendered */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
            {/* Show Accept button ONLY if status is PENDING */}
            {task.status === 'PENDING' && (
              // Use DialogClose if you want the button click to automatically close the dialog *after* the handler runs.
              // However, managing open state in the parent (TaskDashboard) is often more robust, especially for async actions.
              // <DialogClose asChild>
                 <Button onClick={handleAccept} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                   Accept Task
                 </Button>
              // </DialogClose>
            )}

            {/* Show Complete button ONLY if status is IN_PROGRESS */}
            {task.status === 'IN_PROGRESS' && (
              // <DialogClose asChild>
                 <Button onClick={handleComplete} variant="default" className="bg-green-600 text-white hover:bg-green-700">
                    <CheckCheckIcon className="mr-2 h-4 w-4" />
                    Mark Complete
                 </Button>
              // </DialogClose>
            )}

             {/* Optional: Add a generic Close button */}
             <DialogClose asChild>
                <Button variant="outline">Close</Button>
             </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Task;
