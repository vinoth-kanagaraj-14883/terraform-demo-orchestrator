import { useState } from "react";
import { createDeployment, DeploymentRequest } from "@/services/api";

const TEMPLATE_MAP: Record<string, Record<string, string>> = {
  kubernetes: {
    apm: "k8s-apm (ZylkerKart — Kubernetes + APM Agent)",
    network: "network (Network Deployment)",
    vmware: "vmware (VMware Deployment)",
  },
  bare_metal: {
    apm: "baremetal-apm (App + APM + Server)",
    network: "network (Network Deployment)",
    vmware: "vmware (VMware Deployment)",
  },
};

interface Props {
  onCreated: () => void;
}

export default function DeploymentForm({ onCreated }: Props) {
  const [form, setForm] = useState<DeploymentRequest>({
    ticket_id: "",
    sales_engineer: "",
    customer_name: "",
    infrastructure: "kubernetes",
    environment: "apm",
    region: "us-east-1",
    instance_size: "medium",
    demo_duration_days: 7,
    cloud_provider: "azure",
    site24x7_license_key: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isK8sApm =
    form.infrastructure === "kubernetes" && form.environment === "apm";

  const templatePreview =
    TEMPLATE_MAP[form.infrastructure]?.[form.environment] ?? "Unknown";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "demo_duration_days" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const payload: DeploymentRequest = { ...form };
      if (!isK8sApm) {
        delete payload.cloud_provider;
        delete payload.site24x7_license_key;
      }
      await createDeployment(payload);
      setSuccess(true);
      setForm({
        ticket_id: "",
        sales_engineer: "",
        customer_name: "",
        infrastructure: "kubernetes",
        environment: "apm",
        region: "us-east-1",
        instance_size: "medium",
        demo_duration_days: 7,
        cloud_provider: "azure",
        site24x7_license_key: "",
      });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        New Deployment Request
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          Deployment request submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket ID *
            </label>
            <input
              type="text"
              name="ticket_id"
              value={form.ticket_id}
              onChange={handleChange}
              required
              placeholder="DEMO-001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sales Engineer *
            </label>
            <input
              type="text"
              name="sales_engineer"
              value={form.sales_engineer}
              onChange={handleChange}
              required
              placeholder="Jane Smith"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              required
              placeholder="Acme Corp"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <input
              type="text"
              name="region"
              value={form.region}
              onChange={handleChange}
              placeholder="us-east-1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Infrastructure *
            </label>
            <select
              name="infrastructure"
              value={form.infrastructure}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="kubernetes">Kubernetes</option>
              <option value="bare_metal">Bare Metal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment *
            </label>
            <select
              name="environment"
              value={form.environment}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="apm">APM</option>
              <option value="network">Network</option>
              <option value="vmware">VMware</option>
            </select>
          </div>

          {isK8sApm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cloud Provider *
              </label>
              <select
                name="cloud_provider"
                value={form.cloud_provider}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="azure">Azure (AKS)</option>
                <option value="aws">AWS (EKS)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instance Size
            </label>
            <select
              name="instance_size"
              value={form.instance_size}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Demo Duration (days)
            </label>
            <input
              type="number"
              name="demo_duration_days"
              value={form.demo_duration_days}
              onChange={handleChange}
              min={1}
              max={30}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {isK8sApm && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site24x7 License Key{" "}
                <span className="text-gray-400 font-normal">(optional — enables APM monitoring)</span>
              </label>
              <input
                type="text"
                name="site24x7_license_key"
                value={form.site24x7_license_key}
                onChange={handleChange}
                placeholder="Leave empty to skip APM agent installation"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800">
            📋 Selected Template:
          </p>
          <p className="text-sm text-blue-600 mt-1 font-mono">
            {templatePreview}
            {isK8sApm && form.cloud_provider && (
              <span className="ml-2 text-blue-500">
                [{form.cloud_provider === "azure" ? "Azure AKS" : "AWS EKS"}]
              </span>
            )}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? "Submitting..." : "🚀 Submit Deployment Request"}
        </button>
      </form>
    </div>
  );
}
