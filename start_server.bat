@echo off

echo Starting Smart News Aggregator Backend...
cd /d %~dp0
call .venv\Scripts\activate.bat
cd backend
start python run_local.py
cd ../frontend
start npm run dev

pause

