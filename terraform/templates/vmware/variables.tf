variable "deployment_id" {
  description = "Unique deployment identifier"
  type        = string
}

variable "customer_name" {
  description = "Customer name"
  type        = string
}

variable "region" {
  description = "Datacenter / region"
  type        = string
  default     = "us-east-1"
}

variable "instance_size" {
  description = "VM size"
  type        = string
  default     = "medium"
}
