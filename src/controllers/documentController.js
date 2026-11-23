import { DocumentType, UserDocument } from '../db/models/index.js';
import {
  documentSchema,
  documentUpdateSchema,
  firstError,
} from '../schemas/index.js';
import { httpError } from '../utils/httpError.js';
import { formatDateOnly, maskDocumentNumber } from '../utils/documents.js';

const DUPLICATE_TYPE_MESSAGE =
  'Ya registraste un documento de este tipo. Edítalo o elimínalo para cambiarlo.';
const DUPLICATE_NUMBER_MESSAGE =
  'Ese número ya está registrado para este tipo de documento. Revisa que lo hayas escrito bien.';
const FORBIDDEN_MESSAGE = 'No tienes permiso para modificar este documento.';

// Devuelve el mensaje que corresponde al índice único que falló, o null si el
// error no es de unicidad. Sequelize expone las columnas en err.fields.
const duplicateMessage = (err) => {
  if (err.name !== 'SequelizeUniqueConstraintError') {
    return null;
  }

  const columns = Object.keys(err.fields || {});

  return columns.includes('user_id')
    ? DUPLICATE_TYPE_MESSAGE
    : DUPLICATE_NUMBER_MESSAGE;
};

// Busca un documento y comprueba que sea del usuario en sesión.
const findOwnDocument = async (req) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    throw httpError(404, 'Documento no encontrado.');
  }

  const document = await UserDocument.findByPk(id, {
    include: [{ model: DocumentType, as: 'documentType' }],
  });

  if (!document) {
    throw httpError(404, 'Documento no encontrado.');
  }

  if (document.userId !== req.currentUser.id) {
    throw httpError(403, FORBIDDEN_MESSAGE);
  }

  return document;
};

const renderDocuments = async (req, res, { status = 200, error, values = {} } = {}) => {
  const [documents, documentTypes] = await Promise.all([
    UserDocument.findAll({
      where: { userId: req.currentUser.id },
      include: [{ model: DocumentType, as: 'documentType' }],
      order: [['createdAt', 'ASC']],
    }),
    DocumentType.findAll({ where: { isActive: true }, order: [['name', 'ASC']] }),
  ]);

  const usedTypeIds = new Set(documents.map((document) => document.documentTypeId));

  return res.status(status).render('documents', {
    title: 'Mis documentos',
    error,
    values,
    // En la lista el número va enmascarado; el número completo solo se ve al editar.
    documents: documents.map((document) => ({
      id: document.id,
      typeName: document.documentType.name,
      typeCode: document.documentType.code,
      maskedNumber: maskDocumentNumber(document.documentNumber),
      issuedAt: formatDateOnly(document.issuedAt),
      expiresAt: formatDateOnly(document.expiresAt),
      isVerified: document.isVerified,
    })),
    documentTypes: documentTypes.map((type) => ({
      id: type.id,
      name: type.name,
      code: type.code,
      alreadyUsed: usedTypeIds.has(type.id),
    })),
  });
};

const renderEditDocument = (res, document, { status = 200, error, values } = {}) =>
  res.status(status).render('editDocument', {
    title: 'Editar documento',
    error,
    document: {
      id: document.id,
      typeName: document.documentType.name,
      isVerified: document.isVerified,
    },
    values: values || {
      documentNumber: document.documentNumber,
      issuedAt: document.issuedAt || '',
      expiresAt: document.expiresAt || '',
    },
  });

export const listDocuments = (req, res) => renderDocuments(req, res);

export const createDocument = async (req, res) => {
  const { error, value } = documentSchema.validate(req.body || {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return renderDocuments(req, res, {
      status: 400,
      error: firstError(error),
      values: req.body,
    });
  }

  const documentType = await DocumentType.findOne({
    where: { id: value.documentTypeId, isActive: true },
  });

  if (!documentType) {
    return renderDocuments(req, res, {
      status: 400,
      error: 'Selecciona un tipo de documento válido.',
      values: req.body,
    });
  }

  try {
    await UserDocument.create({
      userId: req.currentUser.id,
      documentTypeId: documentType.id,
      documentNumber: value.documentNumber,
      issuedAt: value.issuedAt || null,
      expiresAt: value.expiresAt || null,
    });
  } catch (err) {
    const message = duplicateMessage(err);

    if (!message) {
      throw err;
    }

    return renderDocuments(req, res, { status: 409, error: message, values: req.body });
  }

  return res.redirect(
    `/profile/documents?success=${encodeURIComponent('Documento guardado.')}`
  );
};

export const showEditDocument = async (req, res) => {
  const document = await findOwnDocument(req);

  return renderEditDocument(res, document);
};

export const updateDocument = async (req, res) => {
  const document = await findOwnDocument(req);

  const { error, value } = documentUpdateSchema.validate(req.body || {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return renderEditDocument(res, document, {
      status: 400,
      error: firstError(error),
      values: req.body,
    });
  }

  const changes = {
    documentNumber: value.documentNumber,
    issuedAt: value.issuedAt || null,
    expiresAt: value.expiresAt || null,
  };

  const hasChanges =
    document.documentNumber !== changes.documentNumber ||
    (document.issuedAt || null) !== changes.issuedAt ||
    (document.expiresAt || null) !== changes.expiresAt;

  // Si cambian los datos de un documento ya verificado, la verificación deja
  // de valer y un administrador tendría que revisarlo otra vez.
  if (hasChanges && document.isVerified) {
    changes.isVerified = false;
    changes.verifiedAt = null;
  }

  try {
    await document.update(changes);
  } catch (err) {
    const message = duplicateMessage(err);

    if (!message) {
      throw err;
    }

    return renderEditDocument(res, document, {
      status: 409,
      error: message,
      values: req.body,
    });
  }

  return res.redirect(
    `/profile/documents?success=${encodeURIComponent('Documento actualizado.')}`
  );
};

export const deleteDocument = async (req, res) => {
  const document = await findOwnDocument(req);

  await document.destroy();

  return res.redirect(
    `/profile/documents?success=${encodeURIComponent('Documento eliminado.')}`
  );
};
