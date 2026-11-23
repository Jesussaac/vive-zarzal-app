// Oculta el número de documento y deja visibles solo los últimos dígitos.
// No conserva la longitud original para no dar pistas del formato.
export const maskDocumentNumber = (number) => {
  const value = String(number || '');
  const visible = Math.min(3, Math.floor(value.length / 3));

  return `••••${visible ? value.slice(-visible) : ''}`;
};

// Las fechas DATEONLY llegan como 'AAAA-MM-DD'. Se formatean en UTC para que
// la zona horaria del servidor no corra el día.
export const formatDateOnly = (value) => {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
