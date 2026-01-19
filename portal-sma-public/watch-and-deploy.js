const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Archivo a monitorear
const watchFile = 'supabase/functions/test-constancia-coordinates/index.ts';
const projectRef = 'hbijosnnqdolhxaeepjl';

console.log(`🔍 Monitoreando archivo: ${watchFile}`);
console.log(`🚀 Proyecto: ${projectRef}`);
console.log('📝 Haz cambios en el archivo y se desplegará automáticamente...\n');

// Función para desplegar
function deployFunction() {
    console.log('⚡ Detectado cambio en el archivo...');
    console.log('🔄 Desplegando función...');

    exec(`supabase functions deploy test-constancia-coordinates --project-ref ${projectRef}`,
        { cwd: path.resolve(__dirname) },
        (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Error en el despliegue:', error.message);
                return;
            }

            if (stderr) {
                console.log('⚠️  Advertencias:', stderr);
            }

            console.log('✅ Despliegue exitoso!');
            console.log('📄 Salida:', stdout);
            console.log('\n⏳ Esperando más cambios...\n');
        }
    );
}

// Verificar que el archivo existe
if (!fs.existsSync(watchFile)) {
    console.error(`❌ Error: El archivo ${watchFile} no existe`);
    process.exit(1);
}

// Monitorear el archivo
fs.watchFile(watchFile, { interval: 1000 }, (curr, prev) => {
    // Solo desplegar si el archivo realmente cambió (no solo se accedió)
    if (curr.mtime !== prev.mtime) {
        deployFunction();
    }
});

// Manejar cierre del proceso
process.on('SIGINT', () => {
    console.log('\n👋 Deteniendo el monitoreo...');
    fs.unwatchFile(watchFile);
    process.exit(0);
});

console.log('🎯 Presiona Ctrl+C para detener el monitoreo\n');

