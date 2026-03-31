resource "null_resource" "network_config" {
  triggers = {
    network_name  = var.network_name
    cidr_block    = var.cidr_block
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[networking] Configuring network ${var.network_name} with CIDR ${var.cidr_block} in ${var.region}'"
  }
}

output "network_id" {
  value = "net-${substr(var.deployment_id, 0, 8)}"
}

output "network_status" {
  value = "Network ${var.network_name} (${var.cidr_block}) configured in ${var.region}"
}
