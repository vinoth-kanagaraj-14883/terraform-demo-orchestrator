terraform {
  required_version = ">= 1.5"
  backend "local" {}
}

locals {
  vm_name       = "vm-${lower(replace(var.customer_name, " ", "-"))}-${substr(var.deployment_id, 0, 8)}"
  vm_cpu_map    = { small = 2, medium = 4, large = 8 }
  vm_memory_map = { small = 4096, medium = 8192, large = 16384 }
}

resource "null_resource" "vsphere_vm" {
  triggers = {
    deployment_id = var.deployment_id
    instance_size = var.instance_size
  }

  provisioner "local-exec" {
    command = "echo '[vmware] Provisioning vSphere VM ${local.vm_name} in datacenter ${var.region}'"
  }
}

resource "null_resource" "vm_network_config" {
  depends_on = [null_resource.vsphere_vm]

  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[vmware] Configuring network for VM ${local.vm_name}'"
  }
}

resource "null_resource" "vm_tools_install" {
  depends_on = [null_resource.vm_network_config]

  triggers = {
    deployment_id = var.deployment_id
  }

  provisioner "local-exec" {
    command = "echo '[vmware] Installing VMware Tools on ${local.vm_name}'"
  }
}

resource "local_file" "deployment_manifest" {
  filename = "${path.module}/deployment-${var.deployment_id}.json"
  content = jsonencode({
    deployment_id = var.deployment_id
    customer_name = var.customer_name
    vm_name       = local.vm_name
    region        = var.region
    instance_size = var.instance_size
    template_type = "vmware"
    status        = "deployed"
  })
}
