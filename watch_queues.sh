#!/bin/bash

# Interval between updates (in seconds)
INTERVAL=0.5

while true; do
    clear
    echo "RabbitMQ Queues - Live Update"
    date
    rabbitmqctl list_queues
    sleep $INTERVAL
done
