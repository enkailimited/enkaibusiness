"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Loader2, Plus } from "lucide-react";
import { completeTaskAction, uncompleteTaskAction, addCustomTaskAction } from "../actions";

interface Task {
  id: string; name: string; description: string | null;
  category: string; sortOrder: number; isCompleted: boolean;
  completedAt: Date | null; notes: string | null;
}

export function TaskList({ tasks: initialTasks, ticketId }: { tasks: Task[]; ticketId: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showAdd, setShowAdd] = useState(false);
  const [taskState, taskAction, taskPending] = useActionState(addCustomTaskAction, null);

  const toggleTask = async (task: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t)),
    );
    if (task.isCompleted) {
      await uncompleteTaskAction(task.id);
    } else {
      await completeTaskAction(task.id);
    }
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Tasks ({completedCount}/{tasks.length})</h2>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </div>

      {showAdd && (
        <form action={taskAction} className="flex gap-2 mb-4 p-3 border rounded-md bg-muted/30">
          <input type="hidden" name="ticketId" value={ticketId} />
          <Input name="name" placeholder="Task name" required className="flex-1" />
          <select name="category" className="border rounded-md p-1 text-sm bg-background">
            <option value="setup">Setup</option>
            <option value="configuration">Configuration</option>
            <option value="catalog">Catalog</option>
            <option value="payment">Payment</option>
            <option value="qr">QR</option>
            <option value="training">Training</option>
            <option value="testing">Testing</option>
          </select>
          <Button type="submit" size="sm" disabled={taskPending}>
            {taskPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
          </Button>
        </form>
      )}

      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
            <button onClick={() => toggleTask(task)} className="mt-0.5">
              {task.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                {task.name}
              </p>
              {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
            </div>
            <span className="text-xs text-muted-foreground capitalize">{task.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
