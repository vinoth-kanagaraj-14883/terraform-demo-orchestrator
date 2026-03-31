terraform {
  required_version = ">= 1.5"
  backend "local" {}
}

locals {
  net_prefix  = "10.${parseint(substr(md5(var.deployment_id), 0, 2), 16) % 254}.0.0/16"
  switch_name = "sw-${lower(replace(var.customer_name, " ", "-"))}-${substr(var.deployment_id, 0, 8)}"
}

resource "null_resource" "network_switch" {
  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[network] Configuring switch ${local.switch_name} in region ${var.region}'"
  }
}

resource "null_resource" "firewall_rules" {
  depends_on = [null_resource.network_switch]

  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[network] Applying firewall rules for network ${local.net_prefix}'"
  }
}

resource "null_resource" "load_balancer" {
  depends_on = [null_resource.firewall_rules]

  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[network] Provisioning load balancer for ${var.customer_name}'"
  }
}

resource "local_file" "deployment_manifest" {
  filename = "${path.module}/deployment-${var.deployment_id}.json"
  content = jsonencode({
    deployment_id = var.deployment_id
    customer_name = var.customer_name
    switch_name   = local.switch_name
    network_cidr  = local.net_prefix
    region        = var.region
    template_type = "network"
    status        = "deployed"
  })
}
