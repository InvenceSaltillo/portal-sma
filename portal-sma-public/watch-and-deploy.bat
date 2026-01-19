@echo off
setlocal enabledelayedexpansion

set PROJECT_REF=hbijosnnqdolhxaeepjl
set FUNCTION_NAME=test-pdf-coordinates
set WATCH_FILE=supabase\functions\test-pdf-coordinates\index.ts

echo 🔍 Monitoreando archivo: %WATCH_FILE%
echo 🚀 Proyecto: %PROJECT_REF%
echo 📝 Haz cambios en el archivo y se desplegará automáticamente...
echo.

REM Verificar que el archivo existe
if not exist "%WATCH_FILE%" (
    echo ❌ Error: El archivo %WATCH_FILE% no existe
    pause
    exit /b 1
)

echo 🎯 Presiona Ctrl+C para detener el monitoreo
echo.

REM Obtener tiempo inicial del archivo
for %%F in ("%WATCH_FILE%") do set INITIAL_TIME=%%~tF

:LOOP
    REM Verificar si el archivo cambió
    for %%F in ("%WATCH_FILE%") do set CURRENT_TIME=%%~tF

    if not "!CURRENT_TIME!"=="!INITIAL_TIME!" (
        echo ⚡ Detectado cambio en el archivo...
        echo 🔄 Desplegando función...

        supabase functions deploy %FUNCTION_NAME% --project-ref %PROJECT_REF%

        if !errorlevel! equ 0 (
            echo ✅ Despliegue exitoso!
        ) else (
            echo ❌ Error en el despliegue
        )

        echo.
        echo ⏳ Esperando más cambios...
        echo.

        set INITIAL_TIME=!CURRENT_TIME!
    )

    REM Esperar 1 segundo
    timeout /t 1 /nobreak >nul
    goto LOOP

