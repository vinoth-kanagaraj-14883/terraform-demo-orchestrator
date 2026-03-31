import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { getDeployment, DeploymentRecord } from "@/services/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  planning: "bg-blue-100 text-blue-800",
  applying: "bg-indigo-100 text-indigo-800",
  deployed: "bg-green-100 text-green-800",
  destroying: "bg-orange-100 text-orange-800",
  destroyed: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-800",
};

export default function DeploymentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [deployment, setDeployment] = useState<DeploymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const fetchData = async () => {
      try {
        const data = await getDeployment(id);
        setDeployment(data);
      } catch {
        setError("Deployment not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Not found"}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{deployment.ticket_id} — Terraform Demo Orchestrator</title>
      </Head>
      <main className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-bold text-gray-900">
              {deployment.ticket_id}
            </h1>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Deployment Details
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[deployment.status] || "bg-gray-100"}`}
              >
                {deployment.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 font-mono text-xs">{deployment.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Ticket:</span>
                <span className="ml-2 font-medium">{deployment.ticket_id}</span>
              </div>
              <div>
                <span className="text-gray-500">Sales Engineer:</span>
                <span className="ml-2">{deployment.sales_engineer}</span>
              </div>
              <div>
                <span className="text-gray-500">Customer:</span>
                <span className="ml-2">{deployment.customer_name}</span>
              </div>
              <div>
                <span className="text-gray-500">Infrastructure:</span>
                <span className="ml-2 capitalize">
                  {deployment.infrastructure.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Environment:</span>
                <span className="ml-2 uppercase">{deployment.environment}</span>
              </div>
              <div>
                <span className="text-gray-500">Template:</span>
                <span className="ml-2 font-mono text-xs">
                  {deployment.template_used}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Workspace:</span>
                <span className="ml-2 font-mono text-xs">
                  {deployment.terraform_workspace}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">
                  {new Date(deployment.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="ml-2">
                  {new Date(deployment.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {deployment.outputs && Object.keys(deployment.outputs).length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                Terraform Outputs
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
                {Object.entries(deployment.outputs).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-blue-600">{key}</span>
                    <span className="text-gray-500"> = </span>
                    <span className="text-green-700">
                      {JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deployment.error_message && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-red-700 mb-3">
                Error Details
              </h2>
              <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 overflow-x-auto whitespace-pre-wrap">
                {deployment.error_message}
              </pre>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
