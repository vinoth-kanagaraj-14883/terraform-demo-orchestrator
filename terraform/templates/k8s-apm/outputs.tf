output "deployment_url" {
  description = "URL of the deployed application"
  value       = "http://${lower(replace(var.customer_name, " ", "-"))}.demo.example.com"
}

output "status_message" {
  description = "Deployment status message"
  value       = "Kubernetes + APM deployment for ${var.customer_name} completed in ${var.region}"
}

output "template_type" {
  description = "Template used for deployment"
  value       = "k8s-apm"
}
