'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { createTaskAction } from '@/app/(app)/tasks/actions';

type Option = { id: string; name: string };

export function NewTaskModal({ projects, users }: { projects: Option[]; users: Option[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await createTaskAction(formData);
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New Task</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New Task">
        <form ref={formRef} action={submit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-medium text-gray-500">Title</label>
            <input name="title" required autoFocus className="input" placeholder="Draft newsletter issue 2 copy" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Project</label>
            <select name="projectId" required className="input" defaultValue="">
              <option value="" disabled>
                Select a project…
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Owner</label>
              <select name="ownerId" required className="input" defaultValue="">
                <option value="" disabled>
                  Assign to…
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Reviewer</label>
              <select name="reviewerId" required className="input" defaultValue="">
                <option value="" disabled>
                  Assign reviewer…
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Disclosure label="Add more details" openLabel="Fewer details">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Description</label>
                <textarea name="description" rows={2} className="input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Priority</label>
                  <select name="priority" className="input" defaultValue="MEDIUM">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Est. Hours</label>
                  <input type="number" step="0.5" name="estimatedHours" className="input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Due Date</label>
                  <input type="date" name="dueDate" className="input" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Acceptance Criteria</label>
                <textarea name="acceptanceCriteria" rows={2} className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Definition of Done</label>
                <textarea name="definitionOfDone" rows={2} className="input" />
              </div>
            </div>
          </Disclosure>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
