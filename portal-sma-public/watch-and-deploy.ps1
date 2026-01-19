# Script de PowerShell para monitorear y desplegar automáticamente
param(
    [string]$ProjectRef = "hbijosnnqdolhxaeepjl",
    [string]$FunctionName = "test-constancia-coordinates",
    [string]$WatchFile = "supabase\functions\test-constancia-coordinates\index.ts"
)

Write-Host "🔍 Monitoreando archivo: $WatchFile" -ForegroundColor Cyan
Write-Host "🚀 Proyecto: $ProjectRef" -ForegroundColor Green
Write-Host "📝 Haz cambios en el archivo y se desplegará automáticamente..." -ForegroundColor Yellow
Write-Host ""

# Verificar que el archivo existe
if (-not (Test-Path $WatchFile)) {
    Write-Host "❌ Error: El archivo $WatchFile no existe" -ForegroundColor Red
    exit 1
}

# Función para desplegar
function Deploy-Function {
    Write-Host "⚡ Detectado cambio en el archivo..." -ForegroundColor Magenta
    Write-Host "🔄 Desplegando función..." -ForegroundColor Yellow

    $deployCommand = "supabase functions deploy $FunctionName --project-ref $ProjectRef"

    try {
        $result = Invoke-Expression $deployCommand 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Despliegue exitoso!" -ForegroundColor Green
            Write-Host "📄 Salida:" -ForegroundColor White
            Write-Host $result -ForegroundColor Gray
        } else {
            Write-Host "❌ Error en el despliegue:" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error ejecutando comando: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "⏳ Esperando más cambios..." -ForegroundColor Cyan
    Write-Host ""
}

# Obtener el último tiempo de modificación del archivo
$lastWriteTime = (Get-Item $WatchFile).LastWriteTime

Write-Host "🎯 Presiona Ctrl+C para detener el monitoreo" -ForegroundColor Green
Write-Host ""

# Bucle de monitoreo
try {
    while ($true) {
        Start-Sleep -Seconds 1

        $currentWriteTime = (Get-Item $WatchFile).LastWriteTime

        if ($currentWriteTime -ne $lastWriteTime) {
            $lastWriteTime = $currentWriteTime
            Deploy-Function
        }
    }
}
catch {
    Write-Host ""
    Write-Host "👋 Deteniendo el monitoreo..." -ForegroundColor Yellow
    Write-Host "¡Hasta luego!" -ForegroundColor Green
}

