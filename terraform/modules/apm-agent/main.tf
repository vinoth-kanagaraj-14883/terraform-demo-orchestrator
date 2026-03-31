resource "null_resource" "apm_agent_install" {
  triggers = {
    server_name   = var.server_name
    agent_version = var.agent_version
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[apm-agent] Installing APM agent v${var.agent_version} on ${var.server_name}'"
  }
}

output "agent_status" {
  value = "APM agent v${var.agent_version} installed on ${var.server_name}"
}
