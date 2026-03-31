resource "null_resource" "app_server" {
  triggers = {
    server_name   = var.server_name
    instance_size = var.instance_size
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[app-server] Provisioning application server ${var.server_name} (${var.instance_size}) in ${var.region}'"
  }
}

output "server_ip" {
  value = "192.168.1.${parseint(substr(md5(var.deployment_id), 0, 2), 16) % 254}"
}

output "server_status" {
  value = "Application server ${var.server_name} provisioned (${var.instance_size}) in ${var.region}"
}
