resource "aws_appautoscaling_scheduled_action" "day" {
  name               = "web1lab-service-day"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension

  schedule = "cron(0 8 * * ? *)"
  timezone = "Europe/Kyiv"

  scalable_target_action {
    min_capacity = 2
  }
}

resource "aws_appautoscaling_scheduled_action" "night" {
  name               = "web1lab-service-night"
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension

  schedule = "cron(0 22 * * ? *)"
  timezone = "Europe/Kyiv"

  scalable_target_action {
    min_capacity = 1
  }
}
