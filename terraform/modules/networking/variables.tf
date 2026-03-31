variable "network_name" {
  description = "Network name"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block for the network"
  type        = string
  default     = "10.0.0.0/16"
}

variable "region" {
  description = "Deployment region"
  type        = string
}

variable "deployment_id" {
  description = "Deployment identifier"
  type        = string
}
