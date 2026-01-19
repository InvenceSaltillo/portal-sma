const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

// Configuración
const config = {
    watchFile: 'supabase/functions/test-pdf-coordinates/index.ts',
    projectRef: 'hbijosnnqdolhxaeepjl',
    functionName: 'test-pdf-coordinates',
    debounceDelay: 2000 // Esperar 2 segundos después del último cambio
};

let deployTimeout = null;
let isDeploying = false;

console.log(`🔍 Monitoreando: ${config.watchFile}`);
console.log(`🚀 Proyecto: ${config.projectRef}`);
console.log(`⏱️  Debounce: ${config.debounceDelay}ms`);
console.log('📝 Haz cambios en el archivo y se desplegará automáticamente...\n');

// Función para desplegar
function deployFunction() {
    if (isDeploying) {
        console.log('⏳ Ya hay un despliegue en curso, omitiendo...');
        return;
    }

    isDeploying = true;
    console.log('⚡ Detectado cambio en el archivo...');
    console.log('🔄 Desplegando función...');

    const startTime = Date.now();

    exec(`supabase functions deploy ${config.functionName} --project-ref ${config.projectRef}`,
        { cwd: path.resolve(__dirname) },
        (error, stdout, stderr) => {
            const endTime = Date.now();
            const duration = endTime - startTime;

            isDeploying = false;

            if (error) {
                console.error('❌ Error en el despliegue:', error.message);
                return;
            }

            if (stderr) {
                console.log('⚠️  Advertencias:', stderr);
            }

            console.log(`✅ Despliegue exitoso! (${duration}ms)`);
            console.log('📄 Salida:', stdout);
            console.log(`🕒 ${new Date().toLocaleTimeString()}`);
            console.log('\n⏳ Esperando más cambios...\n');
        }
    );
}

// Función con debounce
function debouncedDeploy() {
    if (deployTimeout) {
        clearTimeout(deployTimeout);
    }

    deployTimeout = setTimeout(() => {
        deployFunction();
        deployTimeout = null;
    }, config.debounceDelay);

    console.log(`⏱️  Esperando ${config.debounceDelay}ms más para cambios...`);
}

// Verificar que el archivo existe
if (!require('fs').existsSync(config.watchFile)) {
    console.error(`❌ Error: El archivo ${config.watchFile} no existe`);
    process.exit(1);
}

// Configurar el watcher
const watcher = chokidar.watch(config.watchFile, {
    ignored: /(^|[\/\\])\../, // Ignorar archivos ocultos
    persistent: true,
    ignoreInitial: true // No disparar en el inicio
});

// Eventos del watcher
watcher
    .on('change', (path) => {
        console.log(`📝 Archivo cambiado: ${path}`);
        debouncedDeploy();
    })
    .on('error', (error) => {
        console.error('❌ Error del watcher:', error);
    });

// Manejar cierre del proceso
process.on('SIGINT', () => {
    console.log('\n👋 Deteniendo el monitoreo...');
    watcher.close();
    if (deployTimeout) {
        clearTimeout(deployTimeout);
    }
    process.exit(0);
});

console.log('🎯 Presiona Ctrl+C para detener el monitoreo\n');

