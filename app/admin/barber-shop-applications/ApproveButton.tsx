'use client';

import { useState } from 'react';

type ApproveButtonProps = {
  applicationId: string;
};

export default function ApproveButton({ applicationId }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/barber-shop-applications/${applicationId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Approval failed');
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Could not approve application.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={loading}
      className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? 'Approving...' : 'Approve'}
    </button>
  );
}
