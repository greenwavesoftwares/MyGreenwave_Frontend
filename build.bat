@echo off
setlocal

(
echo VITE_SECURE_STORAGE_KEY=\$UshaPortal@2099\$
echo VITE_SECURE_STORAGE_PREFIX=MyGreenwave_
echo #VITE_END_POINT=http://localhost:8081/
echo VITE_END_POINT=https://op360.greenware.app:8443/MyGreenwave/
echo VITE_AVATAR_COLORS=`["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#84cc16"]`
echo #VITE_AVATAR_COLORS=["#3b82f6","#10b981","#8b5cf6","#f59e0b","#84cc16"]
echo VITE_IMAGE_API=http://103.147.173.2:8086
echo VITE_SESSION_TIMEOUT=300
echo VITE_BASE_ROUTE=mygreenwave
echo VITE_ENVIRONMENT=production
) > .env

echo.
echo Running production build...
call npm run build

if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
)

echo Build completed successfully.
pause