import { useState } from "react";
import { destroyDeployment, DeploymentRecord } from "@/services/api";

interface Props {
  deployment: DeploymentRecord;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DestroyConfirmDialog({
  deployment,
  onConfirm,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await destroyDeployment(deployment.id);
      onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to destroy deployment");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          ⚠️ Confirm Destroy
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Are you sure you want to destroy this deployment? This action cannot
          be undone.
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div>
            <span className="text-gray-500">Ticket:</span>{" "}
            <span className="font-medium">{deployment.ticket_id}</span>
          </div>
          <div>
            <span className="text-gray-500">Customer:</span>{" "}
            <span className="font-medium">{deployment.customer_name}</span>
          </div>
          <div>
            <span className="text-gray-500">Template:</span>{" "}
            <span className="font-mono text-xs">{deployment.template_used}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Destroying..." : "Yes, Destroy"}
          </button>
        </div>
      </div>
    </div>
  );
}
