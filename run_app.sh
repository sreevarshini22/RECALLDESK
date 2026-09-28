#!/bin/bash
echo "==================================================="
echo "  RECALLDESK - Support That Remembers What Happened"
echo "  HackwithHyderabad 3.0 Full-Stack Innovation"
echo "==================================================="

# Start Backend in background
cd backend
python run_backend.py &
BACKEND_PID=$!
cd ..

# Start Frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend running on http://localhost:8000 (PID $BACKEND_PID)"
echo "Frontend running on http://localhost:5173 (PID $FRONTEND_PID)"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
