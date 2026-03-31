variable "server_name" {
  description = "Name of the server to install APM agent on"
  type        = string
}

variable "agent_version" {
  description = "APM agent version to install"
  type        = string
  default     = "13.0.0"
}

variable "deployment_id" {
  description = "Deployment identifier"
  type        = string
}
