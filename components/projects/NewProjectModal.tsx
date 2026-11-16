'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { createProjectAction } from '@/app/(app)/projects/actions';

type Option = { id: string; name: string };

export function NewProjectModal({ owners, campaigns }: { owners: Option[]; campaigns: Option[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await createProjectAction(formData);
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
      <Button onClick={() => setOpen(true)}>+ New Project</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New Project">
        <form ref={formRef} action={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Name</label>
            <input name="name" required autoFocus className="input" placeholder="Q3 VDR Intelligence Launch" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Owner</label>
            <select name="ownerId" className="input" defaultValue={owners[0]?.id}>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <Disclosure label="Add more details" openLabel="Fewer details">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Description</label>
                <textarea name="description" rows={2} className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Business Goal</label>
                <textarea name="businessGoal" rows={2} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Campaign Type</label>
                  <input name="campaignType" className="input" placeholder="Newsletter, Social, Website…" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Priority</label>
                  <select name="priority" className="input" defaultValue="MEDIUM">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Campaign (optional)</label>
                <select name="campaignId" className="input" defaultValue="">
                  <option value="">—</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Start Date</label>
                  <input type="date" name="startDate" className="input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Deadline</label>
                  <input type="date" name="deadline" className="input" />
                </div>
              </div>
            </div>
          </Disclosure>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
