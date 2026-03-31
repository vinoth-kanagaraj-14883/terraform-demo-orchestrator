variable "server_name" {
  description = "Application server name"
  type        = string
}

variable "instance_size" {
  description = "Server instance size"
  type        = string
  default     = "medium"
}

variable "region" {
  description = "Deployment region"
  type        = string
}

variable "deployment_id" {
  description = "Deployment identifier"
  type        = string
}
