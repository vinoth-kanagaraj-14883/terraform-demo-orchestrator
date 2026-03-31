variable "deployment_id" {
  description = "Unique deployment identifier"
  type        = string
}

variable "customer_name" {
  description = "Customer name"
  type        = string
}

variable "region" {
  description = "Deployment region"
  type        = string
  default     = "us-east-1"
}

variable "instance_size" {
  description = "Instance size"
  type        = string
  default     = "medium"
}
