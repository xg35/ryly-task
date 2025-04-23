"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskItem {
    id: string;
    description: string;
    room_no: string;
    requestor: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    assignee?: string;
}

interface GuestGreetingProps {
    task: TaskItem;
}

const GuestGreeting = ({ task }: GuestGreetingProps) => {
    const greetingMessage = `Hello ${task.requestor}, we are here to assist with your request for ${task.description} in room ${task.room_no}.`;

    return (
        <Card>
            <CardHeader>
                <CardTitle>What to say to the guest</CardTitle>
            </CardHeader>
            <CardContent>
                {greetingMessage}
            </CardContent>
        </Card>
    );
};

export default GuestGreeting;
