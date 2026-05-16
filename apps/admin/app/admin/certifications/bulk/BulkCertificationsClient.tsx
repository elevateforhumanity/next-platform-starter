'use client';

import { useState } from 'react';

interface CertProfile {
  full_name: string | null;
  email: string | null;
}

interface PendingCert {
  id: string;
  user_id: string;
  certification_type_id: string;
  status: string;
  earned_date: string | null;
  profiles: CertProfile | null;
}

interface Props {
  pendingCertifications: PendingCert[];
  certificationTypes: { id: string; name: string }[];
  pendingCount: number;
}

export default function BulkCertificationsClient({
  pendingCertifications,
  certificationTypes,
  pendingCount,
}: Props) {
  const [certs, setCerts] = useState(pendingCertifications);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === certs.length ? new Set() : new Set(certs.map((c) => c.id)),
    );
  };

  const reviewCert = async (certId: string, action: 'approve' | 'reject') => {
    setLoading(certId);
    try {
      const res = await fetch('/api/admin/certifications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: certId, action }),
      });
      if (res.ok) {
        setCerts((prev) => prev.filter((c) => c.id !== certId));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(certId);
          return next;
        });
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch {
      alert('Network error — try again');
    } finally {
      setLoading(null);
    }
  };

  const approveSelected = async () => {
    for (const id of selected) {
      await reviewCert(id, 'approve');
    }
  };

  return (
    <>
      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Filter by Type</option>
              {certificationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option value="">Filter by Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={approveSelected}
              disabled={selected.size === 0}
              className="bg-brand-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve Selected ({selected.size})
            </button>
            {/* Export and Import need dedicated API routes — not yet built */}
            <button
              disabled
              title="Needs /api/admin/certifications/export"
              className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed"
            >
              Export CSV
            </button>
            <button
              disabled
              title="Needs /api/admin/certifications/import"
              className="border px-4 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed"
            >
              Import CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
        </div>
        <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
          <p className="text-sm text-brand-green-800">Approved Today</p>
          <p className="text-2xl font-bold text-brand-green-900">0</p>
        </div>
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4">
          <p className="text-sm text-brand-red-800">Expiring Soon</p>
          <p className="text-2xl font-bold text-brand-red-900">0</p>
        </div>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
          <p className="text-sm text-brand-blue-800">Total Active</p>
          <p className="text-2xl font-bold text-brand-blue-900">0</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Pending Certifications</h2>
            <p className="text-sm text-slate-700">Review and approve certification records</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleAll}
              className="text-sm text-brand-blue-600 hover:text-brand-blue-800"
            >
              {selected.size === certs.length ? 'Clear' : 'Select All'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded"
                    checked={selected.size === certs.length && certs.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Participant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Certification</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Earned Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {certs.length > 0 ? (
                certs.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded"
                        checked={selected.has(cert.id)}
                        onChange={() => toggleSelect(cert.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{cert.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-slate-700">{cert.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{cert.certification_type_id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {cert.earned_date ? new Date(cert.earned_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => reviewCert(cert.id, 'approve')}
                          disabled={loading === cert.id}
                          className="text-brand-green-600 hover:text-brand-green-800 text-sm disabled:opacity-50"
                        >
                          {loading === cert.id ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => reviewCert(cert.id, 'reject')}
                          disabled={loading === cert.id}
                          className="text-brand-red-600 hover:text-brand-red-800 text-sm disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-700">
                    No pending certifications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
