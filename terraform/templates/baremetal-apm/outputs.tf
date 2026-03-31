output "deployment_url" {
  description = "URL of the deployed application"
  value       = "http://${lower(replace(var.customer_name, " ", "-"))}-bm.demo.example.com"
}

output "status_message" {
  description = "Deployment status message"
  value       = "Bare Metal + APM deployment for ${var.customer_name} completed in ${var.region}"
}

output "template_type" {
  description = "Template used for deployment"
  value       = "baremetal-apm"
}
