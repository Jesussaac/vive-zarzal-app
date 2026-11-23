import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { sequelize } from '../src/libraries/DBConnection.js';
import { DocumentType, User, UserDocument } from '../src/db/models/index.js';

let server;
let baseUrl;
let userA;
let userB;
let clientA;
let clientB;
let anonymous;
let cedula;
let pasaporte;
let inactiveType;

const suffix = Date.now().toString().slice(-9);
const accountA = {
  firstName: 'Diana',
  lastName: 'Documento',
  username: `doca${suffix}`,
  email: `doca${suffix}@example.com`,
  password: 'password123',
};
const accountB = {
  firstName: 'Bruno',
  lastName: 'Documento',
  username: `docb${suffix}`,
  email: `docb${suffix}@example.com`,
  password: 'password123',
};

// Números únicos por corrida para no chocar con datos que ya existan.
const numberA = `9${suffix}`;
const numberB = `8${suffix}`;

const createClient = () => {
  let cookie = '';

  const request = async (method, path, data) => {
    const headers = new Headers();

    if (cookie) {
      headers.set('cookie', cookie);
    }

    let body;

    if (data) {
      headers.set('content-type', 'application/x-www-form-urlencoded');
      body = new URLSearchParams(data).toString();
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body,
      redirect: 'manual',
    });

    const authCookie = (response.headers.getSetCookie?.() || []).find((item) =>
      item.startsWith('authentication=')
    );

    if (authCookie) {
      cookie = authCookie.split(';')[0];
    }

    return response;
  };

  return {
    get: (path) => request('GET', path),
    form: (path, data) => request('POST', path, data),
  };
};

const location = (response) =>
  decodeURIComponent(response.headers.get('location') || '');

// El HTML escapa las tildes y comillas, así que se compara sin ellas.
const text = async (response) => (await response.text()).replaceAll('&#34;', '"');

const validDocument = () => ({
  documentTypeId: String(cedula.id),
  documentNumber: numberA,
  issuedAt: '2015-03-10',
  expiresAt: '2035-03-10',
});

before(async () => {
  await sequelize.authenticate();

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  cedula = await DocumentType.findOne({ where: { code: 'CC' } });
  pasaporte = await DocumentType.findOne({ where: { code: 'PA' } });
  assert.ok(
    cedula && pasaporte,
    'No hay tipos de documento. Ejecuta "npm run migrations:run" y "npm run seeds:run".'
  );

  inactiveType = await DocumentType.create({
    name: `Tipo inactivo ${suffix}`,
    code: `X${suffix}`.slice(0, 20),
    isActive: false,
  });

  clientA = createClient();
  clientB = createClient();
  anonymous = createClient();

  for (const account of [accountA, accountB]) {
    await createClient().form('/register', {
      ...account,
      confirmPassword: account.password,
    });
  }

  const loginA = await clientA.form('/login', {
    identifier: accountA.username,
    password: accountA.password,
  });
  const loginB = await clientB.form('/login', {
    identifier: accountB.username,
    password: accountB.password,
  });
  assert.equal(loginA.status, 302);
  assert.equal(loginB.status, 302);

  userA = await User.findOne({ where: { username: accountA.username } });
  userB = await User.findOne({ where: { username: accountB.username } });
  assert.ok(userA && userB, 'No se crearon los usuarios de prueba.');
});

after(async () => {
  // Los documentos se borran en cascada junto con sus usuarios.
  await User.destroy({
    where: { username: [accountA.username, accountB.username] },
  });
  await inactiveType?.destroy();

  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

// Las pruebas dependen del orden: crear -> duplicados -> editar -> eliminar.

test('sin sesión, la gestión de documentos redirige al login', async () => {
  const list = await anonymous.get('/profile/documents');
  const create = await anonymous.form('/profile/documents', validDocument());

  assert.equal(list.status, 302);
  assert.match(location(list), /^\/login/);
  assert.equal(create.status, 302);
  assert.match(location(create), /^\/login/);
  assert.equal(await UserDocument.count({ where: { userId: userA.id } }), 0);
});

test('el selector solo ofrece tipos activos', async () => {
  const html = await text(await clientA.get('/profile/documents'));

  assert.match(html, /Cédula de ciudadanía/);
  assert.ok(!html.includes(inactiveType.name));
});

test('crear un documento válido lo guarda con el número normalizado', async () => {
  const response = await clientA.form('/profile/documents', {
    ...validDocument(),
    documentNumber: ` ${numberA.toLowerCase()} `,
  });

  assert.equal(response.status, 302);
  assert.match(location(response), /success=Documento guardado/);

  const saved = await UserDocument.findOne({ where: { userId: userA.id } });
  assert.equal(saved.documentNumber, numberA);
  assert.equal(saved.issuedAt, '2015-03-10');
  assert.equal(saved.expiresAt, '2035-03-10');
  assert.equal(saved.isVerified, false);
});

test('un tipo inactivo o inexistente no se puede usar', async () => {
  for (const documentTypeId of [String(inactiveType.id), '99999999']) {
    const response = await clientA.form('/profile/documents', {
      ...validDocument(),
      documentTypeId,
      documentNumber: `7${suffix}`,
    });

    assert.equal(response.status, 400);
    assert.match(await text(response), /Selecciona un tipo de documento válido/);
  }

  assert.equal(await UserDocument.count({ where: { userId: userA.id } }), 1);
});

test('la expedición no puede ser posterior al vencimiento', async () => {
  const response = await clientA.form('/profile/documents', {
    documentTypeId: String(pasaporte.id),
    documentNumber: `7${suffix}`,
    issuedAt: '2030-01-02',
    expiresAt: '2030-01-01',
  });

  assert.equal(response.status, 400);
  assert.match(
    await text(response),
    /La fecha de expedición no puede ser posterior a la de vencimiento/
  );
  assert.equal(await UserDocument.count({ where: { userId: userA.id } }), 1);
});

test('rechaza fechas inexistentes y números con formato inválido', async () => {
  const cases = [
    [{ issuedAt: '2026-02-31' }, /La fecha de expedición no es válida/],
    [{ expiresAt: 'mañana' }, /La fecha de vencimiento no es válida/],
    [{ documentNumber: '12' }, /al menos 4 caracteres/],
    [{ documentNumber: '12.345.678' }, /solo puede tener letras, números y guiones/],
    [{ documentTypeId: '' }, /Selecciona un tipo de documento/],
  ];

  for (const [override, pattern] of cases) {
    const response = await clientA.form('/profile/documents', {
      documentTypeId: String(pasaporte.id),
      documentNumber: `7${suffix}`,
      ...override,
    });

    assert.equal(response.status, 400);
    assert.match(await text(response), pattern);
  }

  assert.equal(await UserDocument.count({ where: { userId: userA.id } }), 1);
});

test('registrar dos veces el mismo tipo muestra un error entendible', async () => {
  const response = await clientA.form('/profile/documents', {
    ...validDocument(),
    documentNumber: `7${suffix}`,
  });

  assert.equal(response.status, 409);
  assert.match(await text(response), /Ya registraste un documento de este tipo/);
  assert.equal(await UserDocument.count({ where: { userId: userA.id } }), 1);
});

test('el mismo número y tipo en otra cuenta muestra un error entendible', async () => {
  const response = await clientB.form('/profile/documents', validDocument());

  assert.equal(response.status, 409);

  const html = await text(response);
  assert.match(html, /Ese número ya está registrado para este tipo de documento/);
  // No revela de quién es el documento.
  assert.ok(!html.includes(accountA.username));
  assert.equal(await UserDocument.count({ where: { userId: userB.id } }), 0);
});

test('el mismo número con otro tipo sí se permite', async () => {
  const response = await clientB.form('/profile/documents', {
    ...validDocument(),
    documentTypeId: String(pasaporte.id),
    documentNumber: numberB,
  });

  assert.equal(response.status, 302);
  assert.equal(await UserDocument.count({ where: { userId: userB.id } }), 1);
});

test('campos extra como isVerified se ignoran al crear', async () => {
  const response = await clientA.form('/profile/documents', {
    documentTypeId: String(pasaporte.id),
    documentNumber: `AB-${suffix}`,
    isVerified: 'true',
    userId: String(userB.id),
  });

  assert.equal(response.status, 302);

  const saved = await UserDocument.findOne({
    where: { documentNumber: `AB-${suffix}` },
  });
  assert.equal(saved.userId, userA.id);
  assert.equal(saved.isVerified, false);
});

test('la lista oculta el número y el perfil público nunca lo muestra', async () => {
  const list = await text(await clientA.get('/profile/documents'));

  assert.match(list, /Número: ••••/);
  assert.ok(!list.includes(numberA), 'La lista no debe mostrar el número completo.');

  for (const client of [clientA, clientB, anonymous]) {
    const profile = await text(await client.get(`/users/${userA.id}`));

    assert.ok(!profile.includes(numberA), 'El perfil público no debe mostrar el número.');
    assert.ok(!profile.includes('Cédula de ciudadanía'));
  }
});

test('el número completo solo aparece al editar el documento propio', async () => {
  const doc = await UserDocument.findOne({
    where: { userId: userA.id, documentTypeId: cedula.id },
  });
  const html = await text(await clientA.get(`/profile/documents/${doc.id}/edit`));

  assert.ok(html.includes(`value="${numberA}"`));
});

test('un usuario no ve, edita ni elimina documentos ajenos', async () => {
  const doc = await UserDocument.findOne({
    where: { userId: userA.id, documentTypeId: cedula.id },
  });

  const view = await clientB.get(`/profile/documents/${doc.id}/edit`);
  const edit = await clientB.form(`/profile/documents/${doc.id}/edit`, {
    documentNumber: `6${suffix}`,
  });
  const remove = await clientB.form(`/profile/documents/${doc.id}/delete`, {});

  assert.equal(view.status, 403);
  assert.equal(edit.status, 403);
  assert.equal(remove.status, 403);

  await doc.reload();
  assert.equal(doc.documentNumber, numberA);
});

test('un documento inexistente o con id inválido responde 404', async () => {
  for (const id of ['99999999', 'abc']) {
    const response = await clientA.get(`/profile/documents/${id}/edit`);

    assert.equal(response.status, 404);
  }
});

test('editar actualiza los datos y valida igual que al crear', async () => {
  const doc = await UserDocument.findOne({
    where: { userId: userA.id, documentTypeId: cedula.id },
  });

  const invalid = await clientA.form(`/profile/documents/${doc.id}/edit`, {
    documentNumber: numberA,
    issuedAt: '2040-01-01',
    expiresAt: '2030-01-01',
  });
  assert.equal(invalid.status, 400);
  assert.match(await text(invalid), /no puede ser posterior a la de vencimiento/);

  const valid = await clientA.form(`/profile/documents/${doc.id}/edit`, {
    documentNumber: numberA,
    issuedAt: '2016-04-01',
    expiresAt: '',
  });
  assert.equal(valid.status, 302);
  assert.match(location(valid), /success=Documento actualizado/);

  await doc.reload();
  assert.equal(doc.issuedAt, '2016-04-01');
  assert.equal(doc.expiresAt, null);
});

test('editar al número de otra cuenta muestra el error de duplicado', async () => {
  const docB = await UserDocument.findOne({
    where: { userId: userB.id, documentTypeId: pasaporte.id },
  });

  const response = await clientB.form(`/profile/documents/${docB.id}/edit`, {
    documentNumber: `AB-${suffix}`,
  });

  assert.equal(response.status, 409);
  assert.match(
    await text(response),
    /Ese número ya está registrado para este tipo de documento/
  );

  await docB.reload();
  assert.equal(docB.documentNumber, numberB);
});

test('cambiar los datos de un documento verificado quita la verificación', async () => {
  const doc = await UserDocument.findOne({
    where: { userId: userA.id, documentTypeId: cedula.id },
  });
  await doc.update({ isVerified: true, verifiedAt: new Date() });

  // Sin cambios reales: sigue verificado.
  await clientA.form(`/profile/documents/${doc.id}/edit`, {
    documentNumber: numberA,
    issuedAt: '2016-04-01',
  });
  await doc.reload();
  assert.equal(doc.isVerified, true);

  // Con un cambio real: pierde la verificación.
  await clientA.form(`/profile/documents/${doc.id}/edit`, {
    documentNumber: numberA,
    issuedAt: '2016-04-02',
  });
  await doc.reload();
  assert.equal(doc.isVerified, false);
  assert.equal(doc.verifiedAt, null);
});

test('eliminar quita solo el documento propio', async () => {
  const doc = await UserDocument.findOne({
    where: { userId: userA.id, documentTypeId: cedula.id },
  });

  const response = await clientA.form(`/profile/documents/${doc.id}/delete`, {});

  assert.equal(response.status, 302);
  assert.match(location(response), /success=Documento eliminado/);
  assert.equal(
    await UserDocument.count({ where: { userId: userA.id, documentTypeId: cedula.id } }),
    0
  );
  assert.equal(await UserDocument.count({ where: { userId: userB.id } }), 1);
});
