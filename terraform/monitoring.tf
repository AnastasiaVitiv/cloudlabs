resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "web1lab-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          title  = "ECS Desired Tasks vs Running Tasks"
          region = var.aws_region
          period = 60
          view   = "timeSeries"

          metrics = [
            [
              "ECS/ContainerInsights",
              "DesiredTaskCount",
              "ClusterName", aws_ecs_cluster.main.name,
              "ServiceName", aws_ecs_service.app.name,
              { stat = "Maximum", label = "Desired tasks" }
            ],
            [
              "ECS/ContainerInsights",
              "RunningTaskCount",
              "ClusterName", aws_ecs_cluster.main.name,
              "ServiceName", aws_ecs_service.app.name,
              { stat = "Maximum", label = "Running tasks" }
            ]
          ]
        }
      },

      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          title  = "ECS CPU Utilization"
          region = var.aws_region
          period = 60
          view   = "timeSeries"

          metrics = [
            [
              "AWS/ECS",
              "CPUUtilization",
              "ClusterName", aws_ecs_cluster.main.name,
              "ServiceName", aws_ecs_service.app.name,
              { stat = "Average", label = "CPU %" }
            ]
          ]

          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },

      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6

        properties = {
          title  = "Requests per minute"
          region = var.aws_region
          period = 60
          view   = "timeSeries"

          metrics = [
            [
              "AWS/ApplicationELB",
              "RequestCount",
              "LoadBalancer", aws_lb.main.arn_suffix,
              { stat = "Sum", label = "Requests/min" }
            ]
          ]
        }
      },

      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6

        properties = {
          title  = "ALB Target Response Time (p95)"
          region = var.aws_region
          period = 60
          view   = "timeSeries"

          metrics = [
            [
              "AWS/ApplicationELB",
              "TargetResponseTime",
              "LoadBalancer", aws_lb.main.arn_suffix,
              "TargetGroup", aws_lb_target_group.app.arn_suffix,
              { stat = "p95", label = "p95 response time" }
            ]
          ]

          yAxis = {
            left = {
              min   = 0
              label = "Seconds"
            }
          }
        }
      },

      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6

        properties = {
          title  = "HTTP 5XX Errors"
          region = var.aws_region
          period = 60
          view   = "timeSeries"

          metrics = [
            [
              "AWS/ApplicationELB",
              "HTTPCode_Target_5XX_Count",
              "LoadBalancer", aws_lb.main.arn_suffix,
              "TargetGroup", aws_lb_target_group.app.arn_suffix,
              { stat = "Sum", label = "Target 5XX" }
            ],
            [
              "AWS/ApplicationELB",
              "HTTPCode_ELB_5XX_Count",
              "LoadBalancer", aws_lb.main.arn_suffix,
              { stat = "Sum", label = "Load Balancer 5XX" }
            ]
          ]
        }
      }
    ]
  })
}
