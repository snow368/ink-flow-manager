import { db } from '../db';
import type { TaskRecord } from '../db';

export async function createTask(artistId: string, data: {
  title: string;
  description?: string;
  assigneeId?: string;
  locationId?: string;
  clientId?: string;
  priority?: TaskRecord['priority'];
  category?: TaskRecord['category'];
  dueDate?: number;
}): Promise<string> {
  const id = 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  await db.tasks.add({
    id,
    artistId,
    status: 'pending',
    priority: data.priority || 'medium',
    category: data.category || 'general',
    createdAt: Date.now(),
    ...data,
  });
  return id;
}

export async function updateTaskStatus(id: string, status: TaskRecord['status']) {
  const update: Partial<TaskRecord> = { status };
  if (status === 'done') update.completedAt = Date.now();
  await db.tasks.update(id, update);
}

export async function getOverdueTasks(artistIds: string[]): Promise<TaskRecord[]> {
  const all = await db.tasks.where('artistId').anyOf(artistIds).toArray();
  return all.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < Date.now());
}

export async function getTasksByStatus(artistIds: string[], status: TaskRecord['status']): Promise<TaskRecord[]> {
  return db.tasks.where('artistId').anyOf(artistIds).filter(t => t.status === status).toArray();
}

export async function deleteTask(id: string) {
  await db.tasks.delete(id);
}
