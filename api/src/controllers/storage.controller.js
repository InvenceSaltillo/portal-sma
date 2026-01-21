/**
 * Controller para operaciones de Storage
 */

/**
 * Subir archivo a Storage
 * POST /api/storage/upload
 * Body: JSON con { path, file: base64 o buffer }
 * O FormData con 'file' y 'path'
 */
export const uploadFile = async (req, res, next) => {
  try {
    let fileBuffer;
    let fileName;
    let mimeType;
    let filePath;

    // Intentar obtener desde FormData (si se usa multipart/form-data)
    if (req.body.file && typeof req.body.file === 'string') {
      // Base64 string
      const base64Data = req.body.file.replace(/^data:.*,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      fileName = req.body.filename || 'file';
      mimeType = req.body.mime_type || 'application/octet-stream';
      filePath = req.body.path;
    } else if (req.body.path && req.body.file) {
      // Ya viene como buffer o base64
      fileBuffer = Buffer.isBuffer(req.body.file)
        ? req.body.file
        : Buffer.from(req.body.file, 'base64');
      fileName = req.body.filename || 'file';
      mimeType = req.body.mime_type || 'application/octet-stream';
      filePath = req.body.path;
    } else {
      return res.status(400).json({
        error: 'Se requiere: path, file (base64 o buffer), filename, mime_type'
      });
    }

    if (!filePath) {
      return res.status(400).json({ error: 'path es requerido' });
    }

    const { data, error } = await req.supabase.storage
      .from('clients')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: '3600'
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: urlData } = req.supabase.storage
      .from('clients')
      .getPublicUrl(filePath);

    res.json({
      path: data.path,
      url: urlData.publicUrl,
      filename: fileName,
      mime_type: mimeType,
      size: fileBuffer.length
    });
  } catch (error) {
    next(error);
  }
};
