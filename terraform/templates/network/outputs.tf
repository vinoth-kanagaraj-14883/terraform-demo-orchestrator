output "deployment_url" {
  description = "Network management URL"
  value       = "http://netmgmt-${lower(replace(var.customer_name, " ", "-"))}.demo.example.com"
}

output "status_message" {
  description = "Deployment status message"
  value       = "Network deployment for ${var.customer_name} completed in ${var.region}"
}

output "template_type" {
  description = "Template used for deployment"
  value       = "network"
}
