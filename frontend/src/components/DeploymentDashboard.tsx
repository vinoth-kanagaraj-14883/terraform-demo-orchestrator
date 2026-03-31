import { useEffect, useState } from "react";
import { listDeployments, DeploymentRecord } from "@/services/api";
import DestroyConfirmDialog from "./DestroyConfirmDialog";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  planning: "bg-blue-100 text-blue-800",
  applying: "bg-indigo-100 text-indigo-800",
  deployed: "bg-green-100 text-green-800",
  destroying: "bg-orange-100 text-orange-800",
  destroyed: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-800",
};

interface Props {
  refreshKey?: number;
}

export default function DeploymentDashboard({ refreshKey }: Props) {
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [destroyTarget, setDestroyTarget] = useState<DeploymentRecord | null>(
    null
  );

  const fetchDeployments = async () => {
    try {
      const data = await listDeployments();
      setDeployments(data);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [refreshKey]);

  useEffect(() => {
    const interval = setInterval(fetchDeployments, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDestroyComplete = () => {
    setDestroyTarget(null);
    fetchDeployments();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
        Loading deployments...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Deployments</h2>
        <span className="text-xs text-gray-400">Auto-refreshes every 5s</span>
      </div>

      {deployments.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No deployments yet. Submit a request above to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-600 font-medium">
                  Ticket
                </th>
                <th className="text-left py-2 px-3 text-gray-600 font-medium">
                  Customer
                </th>
                <th className="text-left py-2 px-3 text-gray-600 font-medium">
                  Template
                </th>
                <th className="text-left py-2 px-3 text-gray-600 font-medium">
                  Status
                </th>
                <th className="text-left py-2 px-3 text-gray-600 font-medium">
                  Created
                </th>
                <th className="text-left py-2 px-3 text-gray-600 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((dep) => (
                <tr
                  key={dep.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2 px-3 font-mono text-xs">
                    <a
                      href={`/deployments/${dep.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {dep.ticket_id}
                    </a>
                  </td>
                  <td className="py-2 px-3">{dep.customer_name}</td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-600">
                    {dep.template_used}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[dep.status] || "bg-gray-100 text-gray-600"}`}
                    >
                      {dep.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-500 text-xs">
                    {new Date(dep.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 px-3">
                    {dep.status === "deployed" && (
                      <button
                        onClick={() => setDestroyTarget(dep)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                      >
                        Destroy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {destroyTarget && (
        <DestroyConfirmDialog
          deployment={destroyTarget}
          onConfirm={handleDestroyComplete}
          onCancel={() => setDestroyTarget(null)}
        />
      )}
    </div>
  );
}
