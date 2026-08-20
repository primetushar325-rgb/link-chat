#!/bin/bash
echo "Checking .env.example keys..."
grep -E "^[A-Z_]+=" .env.example
echo "--- backend ---"
grep -E "B2_" backend/src/lib/s3.ts | head
