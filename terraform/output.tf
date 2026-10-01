output "cluster_id" {
  value = aws_eks_cluster.udaydevops.id
}

output "node_group_id" {
  value = aws_eks_node_group.udaydevops.id
}

output "vpc_id" {
  value = aws_vpc.udaydevops_vpc.id
}

output "subnet_ids" {
  value = aws_subnet.udaydevops_subnet[*].id
}