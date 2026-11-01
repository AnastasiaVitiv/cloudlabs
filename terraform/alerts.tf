resource "aws_sns_topic" "alerts" {
  name = "web1lab-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.budget_email
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name        = "web1lab-ecs-cpu-high"
  alarm_description = "ECS service CPU utilization is above 70% for two consecutive minutes."

  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  datapoints_to_alarm = 2

  metric_name = "CPUUtilization"
  namespace   = "AWS/ECS"
  period      = 60
  statistic   = "Average"
  threshold   = 70

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  treat_missing_data = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "ecs_max_tasks" {
  alarm_name        = "web1lab-ecs-max-tasks"
  alarm_description = "ECS service reached the maximum desired task count of 4."

  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  datapoints_to_alarm = 2

  metric_name = "DesiredTaskCount"
  namespace   = "ECS/ContainerInsights"
  period      = 60
  statistic   = "Maximum"
  threshold   = 4

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.app.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  treat_missing_data = "notBreaching"
}