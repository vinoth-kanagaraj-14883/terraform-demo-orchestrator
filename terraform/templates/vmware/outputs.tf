output "deployment_url" {
  description = "VM console URL"
  value       = "https://vsphere-${lower(replace(var.customer_name, " ", "-"))}.demo.example.com"
}

output "status_message" {
  description = "Deployment status message"
  value       = "VMware deployment for ${var.customer_name} completed in datacenter ${var.region}"
}

output "template_type" {
  description = "Template used for deployment"
  value       = "vmware"
}
