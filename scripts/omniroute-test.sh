#!/usr/bin/env bash
# Example request to a local OmniRoute chat-completions endpoint.
# Requires OMNIROUTE_API_KEY to be set in the environment.
set -euo pipefail

curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer $OMNIROUTE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'
