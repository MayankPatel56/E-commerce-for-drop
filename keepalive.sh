#!/bin/sh
cd /home/z/my-project
unset DATABASE_URL
unset DIRECT_URL
while true; do
  npx next dev -p 3000 2>/dev/null
  echo "Server exited, restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
