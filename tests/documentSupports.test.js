import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import app from '../src/app.js';
import { sequelize } from '../src/libraries/DBConnection.js';
import { DocumentType, User, UserDocument } from '../src/db/models/index.js';
import {
  MAX_SUPPORT_SIZE,
  SUPPORTS_DIR,
} from '../src/middlewares/uploadSupport.js';

let server;
let baseUrl;
let userA;
let userB;
let clientA;
let clientB;
let anonymous;
let cedula;
let pasaporte;
let docA;
let docWithoutSupport;

const suffix = Date.now().toString().slice(-9);
const accountA = {
  firstName: 'Sara',
  lastName: 'Soporte',
  username: `supa${suffix}`,
  email: `supa${suffix}@example.com`,
  password: 'password123',
};
const accountB = {
  firstName: 'Simon',
  lastName: 'Soporte',
  username: `supb${suffix}`,
  email: `supb${suffix}@example.com`,
  password: 'password123',
};

// Archivos mínimos. El filtro de Multer revisa el tipo MIME que declara el cliente.
const PDF = {
  name: 'soporte.pdf',
  type: 'application/pdf',
  bytes: Buffer.from('%PDF-1.4\n% archivo de prueba\n'),
};
const PNG = {
  name: 'soporte.png',
  type: 'image/png',
  bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
};
const TXT = {
  name: 'notas.txt',
  type: 'text/plain',
  bytes: Buffer.from('esto no es un soporte valido'),
};

const createClient = () => {
  let cookie = '';

  const request = async (method, requestPath, { data, body } = {}) => {
    const headers = new Headers();

    if (cookie) {
      headers.set('cookie', cookie);
    }

    let payload = body;

    if (data) {
      headers.set('content-type', 'application/x-www-form-urlencoded');
      payload = new URLSearchParams(data).toString();
    }

    const response = await fetch(`${baseUrl}${requestPath}`, {
      method,
      headers,
      body: payload,
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
    get: (requestPath) => request('GET', requestPath),
    form: (requestPath, data) => request('POST', requestPath, { data }),
    // Sube un archivo en el campo "support", como lo hace el formulario.
    upload: (requestPath, file) => {
      const body = new FormData();
      body.append('support', new Blob([file.bytes], { type: file.type }), file.name);
      return request('POST', requestPath, { body });
    },
  };
};

const location = (response) =>
  decodeURIComponent(response.headers.get('location') || '');

// El HTML escapa las comillas, así que se comparan sin ellas.
const text = async (response) =>
  (await response.text()).replaceAll('&#34;', '"');

const storedFiles = () => fs.readdirSync(SUPPORTS_DIR).sort();

const currentSupport = async () =>
  (await UserDocument.findByPk(docA.id)).supportPath;

const supportUrl = (id) => `/profile/documents/${id}/support`;

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

  // Los documentos se crean directo en la base: aquí solo se prueba el soporte.
  docA = await UserDocument.create({
    userId: userA.id,
    documentTypeId: cedula.id,
    documentNumber: `7${suffix}`,
  });
  docWithoutSupport = await UserDocument.create({
    userId: userA.id,
    documentTypeId: pasaporte.id,
    documentNumber: `SP-${suffix}`,
  });
});

after(async () => {
  const userIds = [userA?.id, userB?.id].filter(Boolean);

  // Se borran los archivos que hayan quedado antes de borrar los registros.
  const documents = await UserDocument.findAll({ where: { userId: userIds } });

  for (const document of documents) {
    if (document.supportPath) {
      fs.rmSync(path.join(SUPPORTS_DIR, path.basename(document.supportPath)), {
        force: true,
      });
    }
  }

  // Los documentos se borran en cascada junto con sus usuarios.
  await User.destroy({
    where: { username: [accountA.username, accountB.username] },
  });

  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

// Las pruebas dependen del orden: rechazos -> subir -> descargar -> acceso ajeno
// -> reemplazar -> eliminar.

test('los soportes se guardan fuera de la carpeta pública', () => {
  const publicDir = path.join(process.cwd(), 'src', 'public');

  assert.ok(!SUPPORTS_DIR.startsWith(publicDir));
});

test('sin sesión no se puede subir ni descargar un soporte', async () => {
  const filesBefore = storedFiles();

  const upload = await anonymous.upload(supportUrl(docA.id), PDF);
  const download = await anonymous.get(supportUrl(docA.id));

  assert.equal(upload.status, 302);
  assert.match(location(upload), /^\/login/);
  assert.equal(download.status, 302);
  assert.match(location(download), /^\/login/);
  assert.deepEqual(storedFiles(), filesBefore);
});

test('un archivo de tipo no permitido se rechaza con 400', async () => {
  const filesBefore = storedFiles();

  const response = await clientA.upload(supportUrl(docA.id), TXT);

  assert.equal(response.status, 400);
  assert.match(await text(response), /PDF, JPG o PNG/);
  assert.equal(await currentSupport(), null);
  assert.deepEqual(storedFiles(), filesBefore);
});

test('un archivo que supera el tamaño máximo se rechaza con 400', async () => {
  const filesBefore = storedFiles();

  const response = await clientA.upload(supportUrl(docA.id), {
    name: 'grande.pdf',
    type: 'application/pdf',
    bytes: Buffer.alloc(MAX_SUPPORT_SIZE + 1, 0x41),
  });

  assert.equal(response.status, 400);
  assert.match(await text(response), /supera el tama.o m.ximo/);
  assert.equal(await currentSupport(), null);
  assert.deepEqual(storedFiles(), filesBefore);
});

test('enviar el formulario sin archivo responde 400', async () => {
  const response = await clientA.form(supportUrl(docA.id), {});

  assert.equal(response.status, 400);
  assert.match(await text(response), /Debes adjuntar un soporte/);
  assert.equal(await currentSupport(), null);
});

test('subir un PDF válido lo guarda con un nombre generado por el servidor', async () => {
  const filesBefore = storedFiles();

  const response = await clientA.upload(supportUrl(docA.id), PDF);

  assert.equal(response.status, 302);
  assert.match(location(response), /success=Soporte cargado/);

  await docA.reload();
  assert.match(docA.supportPath, /^[0-9a-f-]{36}\.pdf$/);
  assert.equal(storedFiles().length, filesBefore.length + 1);
  assert.ok(fs.existsSync(path.join(SUPPORTS_DIR, docA.supportPath)));
});

test('el dueño puede descargar su soporte', async () => {
  const response = await clientA.get(supportUrl(docA.id));

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/pdf/);
  assert.match(response.headers.get('cache-control'), /private/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), PDF.bytes);
});

test('un tercero recibe 403 al subir, descargar o eliminar el soporte ajeno', async () => {
  const name = await currentSupport();
  const filesBefore = storedFiles();

  const upload = await clientB.upload(supportUrl(docA.id), PNG);
  const download = await clientB.get(supportUrl(docA.id));
  const remove = await clientB.form(`/profile/documents/${docA.id}/delete`, {});

  assert.equal(upload.status, 403);
  assert.equal(download.status, 403);
  assert.equal(remove.status, 403);

  // La autorización va antes de Multer: no se escribe nada en disco.
  assert.deepEqual(storedFiles(), filesBefore);
  assert.equal(await currentSupport(), name);
  assert.ok(fs.existsSync(path.join(SUPPORTS_DIR, name)));
});

test('el soporte no es accesible por una URL pública directa', async () => {
  const name = await currentSupport();

  for (const url of [
    `/uploads/${name}`,
    `/supports/${name}`,
    `/storage/supports/${name}`,
    `/public/${name}`,
  ]) {
    for (const client of [anonymous, clientA, clientB]) {
      const response = await client.get(url);

      assert.equal(response.status, 404, url);
    }
  }
});

test('subir otro soporte reemplaza al anterior y borra el archivo viejo', async () => {
  const previous = await currentSupport();
  const filesBefore = storedFiles();

  const response = await clientA.upload(supportUrl(docA.id), PNG);

  assert.equal(response.status, 302);

  await docA.reload();
  assert.notEqual(docA.supportPath, previous);
  assert.match(docA.supportPath, /\.png$/);
  assert.ok(!fs.existsSync(path.join(SUPPORTS_DIR, previous)));
  assert.ok(fs.existsSync(path.join(SUPPORTS_DIR, docA.supportPath)));
  assert.equal(storedFiles().length, filesBefore.length);
});

test('un documento inexistente o con id inválido responde 404', async () => {
  const filesBefore = storedFiles();

  for (const id of ['99999999', 'abc']) {
    const download = await clientA.get(supportUrl(id));
    const upload = await clientA.upload(supportUrl(id), PDF);

    assert.equal(download.status, 404);
    assert.equal(upload.status, 404);
  }

  assert.deepEqual(storedFiles(), filesBefore);
});

test('descargar el soporte de un documento que no tiene responde 404', async () => {
  const response = await clientA.get(supportUrl(docWithoutSupport.id));

  assert.equal(response.status, 404);
  assert.match(await text(response), /no tiene soporte/);
});

test('eliminar el documento borra también el archivo físico', async () => {
  const name = await currentSupport();
  assert.ok(fs.existsSync(path.join(SUPPORTS_DIR, name)));

  const response = await clientA.form(`/profile/documents/${docA.id}/delete`, {});

  assert.equal(response.status, 302);
  assert.match(location(response), /success=Documento eliminado/);
  assert.equal(await UserDocument.count({ where: { id: docA.id } }), 0);
  assert.ok(!fs.existsSync(path.join(SUPPORTS_DIR, name)));
});
