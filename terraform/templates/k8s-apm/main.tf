terraform {
  required_version = ">= 1.5"
  backend "local" {}
}

locals {
  namespace     = "demo-${lower(replace(var.customer_name, " ", "-"))}"
  app_name      = "demo-app-${var.deployment_id}"
  apm_agent_ver = "13.0.0"
}

resource "null_resource" "k8s_namespace" {
  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[k8s-apm] Creating namespace ${local.namespace} for customer ${var.customer_name} in region ${var.region}'"
  }
}

resource "null_resource" "k8s_app_deployment" {
  depends_on = [null_resource.k8s_namespace]

  triggers = {
    deployment_id = var.deployment_id
    instance_size = var.instance_size
  }

  provisioner "local-exec" {
    command = "echo '[k8s-apm] Deploying application ${local.app_name} with instance size ${var.instance_size}'"
  }
}

resource "null_resource" "apm_sidecar" {
  depends_on = [null_resource.k8s_app_deployment]

  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[k8s-apm] Injecting APM sidecar agent v${local.apm_agent_ver} into ${local.app_name}'"
  }
}

resource "local_file" "deployment_manifest" {
  filename = "${path.module}/deployment-${var.deployment_id}.json"
  content = jsonencode({
    deployment_id = var.deployment_id
    customer_name = var.customer_name
    namespace     = local.namespace
    app_name      = local.app_name
    apm_version   = local.apm_agent_ver
    region        = var.region
    instance_size = var.instance_size
    template_type = "k8s-apm"
    status        = "deployed"
  })
}
