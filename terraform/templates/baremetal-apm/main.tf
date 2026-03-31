terraform {
  required_version = ">= 1.5"
  backend "local" {}
}

locals {
  server_name   = "srv-${lower(replace(var.customer_name, " ", "-"))}-${substr(var.deployment_id, 0, 8)}"
  apm_agent_ver = "13.0.0"
}

resource "null_resource" "server_provision" {
  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[baremetal-apm] Provisioning bare metal server ${local.server_name} in ${var.region}'"
  }
}

resource "null_resource" "app_install" {
  depends_on = [null_resource.server_provision]

  triggers = {
    deployment_id = var.deployment_id
    instance_size = var.instance_size
  }

  provisioner "local-exec" {
    command = "echo '[baremetal-apm] Installing application on ${local.server_name} (size: ${var.instance_size})'"
  }
}

resource "null_resource" "apm_agent_install" {
  depends_on = [null_resource.app_install]

  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[baremetal-apm] Installing APM agent v${local.apm_agent_ver} on ${local.server_name}'"
  }
}

resource "local_file" "deployment_manifest" {
  filename = "${path.module}/deployment-${var.deployment_id}.json"
  content = jsonencode({
    deployment_id = var.deployment_id
    customer_name = var.customer_name
    server_name   = local.server_name
    apm_version   = local.apm_agent_ver
    region        = var.region
    instance_size = var.instance_size
    template_type = "baremetal-apm"
    status        = "deployed"
  })
}
