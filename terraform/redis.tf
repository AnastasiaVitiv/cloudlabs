resource "aws_security_group" "redis" {
  name        = "web1lab-redis-sg"
  description = "Allow Redis traffic from application ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web1lab-redis-sg"
  }
}

resource "aws_service_discovery_private_dns_namespace" "redis" {
  name        = "web1lab.local"
  description = "Private service discovery for web1lab"
  vpc         = aws_vpc.main.id
}

resource "aws_service_discovery_service" "redis" {
  name = "redis"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.redis.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }
}

resource "aws_ecs_task_definition" "redis" {
  family                   = "web1lab-redis-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "redis"
      image     = "redis:7-alpine"
      essential = true

      portMappings = [
        {
          containerPort = 6379
          hostPort      = 6379
          protocol      = "tcp"
        }
      ]

      command = [
        "redis-server",
        "--save", "",
        "--appendonly", "no",
        "--maxmemory", "64mb",
        "--maxmemory-policy", "allkeys-lru"
      ]

      healthCheck = {
        command     = ["CMD", "redis-cli", "ping"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 10
      }
    }
  ])
}

resource "aws_ecs_service" "redis" {
  name                  = "web1lab-redis"
  cluster               = aws_ecs_cluster.main.id
  task_definition       = aws_ecs_task_definition.redis.arn
  desired_count         = 1
  launch_type           = "FARGATE"
  wait_for_steady_state = true

  network_configuration {
    subnets = [
      aws_subnet.private_1.id,
      aws_subnet.private_2.id
    ]

    security_groups  = [aws_security_group.redis.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.redis.arn
  }

  depends_on = [
    aws_iam_role_policy_attachment.ecs_execution,
    aws_route_table_association.private_1,
    aws_route_table_association.private_2
  ]
}
