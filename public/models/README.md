# Face-API.js Models

Esta carpeta contiene los modelos de machine learning necesarios para la detección de emociones facial usando face-api.js.

## Modelos Requeridos

Para que la detección de emociones funcione correctamente, necesitas los siguientes archivos de modelo:

### 1. Tiny Face Detector
- `tiny_face_detector_model-shard1`
- `tiny_face_detector_model-weights_manifest.json`

### 2. Face Landmark 68 Point
- `face_landmark_68_model-shard1`  
- `face_landmark_68_model-weights_manifest.json`

### 3. Face Recognition
- `face_recognition_model-shard1`
- `face_recognition_model-shard2` 
- `face_recognition_model-weights_manifest.json`

### 4. Face Expression (Ya presente)
- ✅ `face_expression_model-shard1`
- ✅ `face_expression_model-weights_manifest.json`

## Cómo Descargar los Modelos

Los modelos se pueden descargar desde el repositorio oficial de face-api.js:

```bash
# Opción 1: Descarga directa desde GitHub
# Visita: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

# Opción 2: Usar curl (reemplaza con las URLs correctas)
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json

curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json

curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
```

## Tamaño de los Modelos

- **tiny_face_detector**: ~190KB
- **face_landmark_68**: ~350KB  
- **face_recognition**: ~6.2MB
- **face_expression**: ~310KB (ya presente)

## Funcionamiento sin Modelos

Si los modelos no están presentes, la aplicación automáticamente intentará usar Gemini Vision API para la detección de emociones. Si ninguno está disponible, la funcionalidad de emociones estará deshabilitada pero la entrevista con ElevenLabs funcionará normalmente.

## Verificación

Para verificar que todos los modelos estén presentes, la aplicación mostrará el estado de conexión del "Emotion AI" en la interfaz de entrevista:

- 🟢 Verde: Modelos cargados correctamente
- 🔴 Rojo: Modelos faltantes o error en la carga

## Troubleshooting

### Error: "Failed to load face-api.js models"
- Verifica que todos los archivos de modelo estén en `/public/models/`
- Asegúrate de que los nombres de archivo coincidan exactamente
- Revisa la consola del navegador para errores específicos

### Detección de emociones no funciona
- Verifica permisos de cámara
- Asegúrate de que tu cara esté bien iluminada y visible
- Los modelos necesitan unos segundos para cargar al iniciar la entrevista

## Privacidad

Todos los modelos se ejecutan completamente en el navegador. No se envían datos de video a servidores externos cuando se usa face-api.js (a diferencia de Gemini Vision API).