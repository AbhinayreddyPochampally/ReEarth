'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload } from '@/components/reearth/Icons';
import { Card } from '@/components/reearth/ui';
import { reuploadBillAction } from '../actions';

// Re-upload form for a sent-back bill (UI sketch p18). Single file picker,
// no kind/vendor/period — those carry over from the original upload.

interface Props {
  billId: string;
}

export default function ReuploadForm({ billId }: Props): React.ReactElement {
  const router = useRouter();
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    setFilename(file ? file.name : '');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError('');
    if (!filename) {
      setError('Pick a file to re-upload first.');
      return;
    }
    const formEl = event.currentTarget;
    startTransition(async () => {
      const fd = new FormData(formEl);
      const result = await reuploadBillAction(billId, fd);
      if (result.ok) {
        router.push('/contributor/bills');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Card className="border-2 border-dashed border-[var(--line-strong)] bg-[var(--bg-subtle)] p-5 text-center">
        <Camera className="mx-auto text-[var(--ink-2)]" size={26} />
        <div className="t-body-sm mt-2 font-semibold">Take a clearer photo</div>
        <div className="t-caption mt-1">Or pick a corrected PDF from your device</div>
        <label className="mt-3 inline-block cursor-pointer rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--accent-soft)]">
          <input
            accept="application/pdf,image/*"
            className="sr-only"
            name="file"
            onChange={handleFileChange}
            type="file"
          />
          Choose file
        </label>
        {filename && <div className="t-caption mt-2">· {filename}</div>}
      </Card>

      {error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        disabled={isPending || !filename}
        type="submit"
      >
        <Upload size={16} />
        {isPending ? 'Re-uploading…' : 'Re-upload to HO'}
      </button>
    </form>
  );
}
