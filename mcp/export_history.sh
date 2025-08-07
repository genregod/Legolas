#!/usr/bin/env bash
# export_history.sh — re-run last N commands and log their output 1️⃣ Parameterize 
# number of commands (defaults to 3)
N=${1:-3}
# 2️⃣ Define a timestamped log artifact
LOGFILE=${2:-"command-output-$(date +%Y%m%d_%H%M%S).log"} echo "▶ Replaying last $N 
commands and aggregating output → $LOGFILE"
# 3️⃣ Ensure your in-session history is flushed
history -a
# 4️⃣ Extract, sanitize, and replay each entry
mapfile -t CMDS < <(history | tail -n "$N" | sed 
's/^[[:space:]]*[0-9]\+[[:space:]]*//') for CMD in "${CMDS[@]}"; do
  echo "\$ $CMD" | tee -a "$LOGFILE" eval "$CMD" &>>"$LOGFILE" done
echo "✔ Log complete: $LOGFILE"
