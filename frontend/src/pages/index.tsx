import { useState } from "react";
import Head from "next/head";
import DeploymentForm from "@/components/DeploymentForm";
import DeploymentDashboard from "@/components/DeploymentDashboard";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <Head>
        <title>Terraform Demo Orchestrator</title>
        <meta
          name="description"
          content="Self-service Terraform deployment portal for sales engineers"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              TF
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Terraform Demo Orchestrator
              </h1>
              <p className="text-xs text-gray-500">
                Self-service deployment portal for sales engineers
              </p>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <DeploymentForm onCreated={handleCreated} />
          <DeploymentDashboard refreshKey={refreshKey} />
        </div>
      </main>
    </>
  );
}
