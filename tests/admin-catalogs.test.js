import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Op } from 'sequelize';
import app from '../src/app.js';
import { sequelize } from '../src/libraries/DBConnection.js';
import {
  Category,
  Publication,
  Role,
  Tag,
  User,
  UserRole,
} from '../src/db/models/index.js';

let server;
let baseUrl;
const clients = {};
const users = {};
let categoryInUse;
let tagInUse;
let publication;

const suffix = Date.now().toString().slice(-9);
const accounts = {
  admin: 'adm',
  moderator: 'mod',
  member: 'mem',
};

const createClient = () => {
  let cookie = '';

  return {
    async fetch(path, options = {}) {
      const headers = new Headers(options.headers || {});

      if (cookie) {
        headers.set('cookie', cookie);
      }

      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        redirect: 'manual',
      });

      const authCookie = (response.headers.getSetCookie?.() || []).find(
        (item) => item.startsWith('authentication=')
      );

      if (authCookie) {
        cookie = authCookie.split(';')[0];
      }

      return response;
    },

    form(path, data) {
      return this.fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
    },
  };
};

const location = (response) =>
  decodeURIComponent(response.headers.get('location') || '');

const makeAccount = (prefix) => ({
  firstName: 'Admin',
  lastName: 'Prueba',
  username: `${prefix}${suffix}`,
  email: `${prefix}${suffix}@example.com`,
  password: 'password123',
});

const catName = `Cat Prueba ${suffix}`;
const catSlug = `cat-prueba-${suffix}`;
const tagName = `Tag Prueba ${suffix}`;
const tagSlug = `tag-prueba-${suffix}`;

before(async () => {
  await sequelize.authenticate();

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  for (const [key, prefix] of Object.entries(accounts)) {
    const account = makeAccount(prefix);
    await createClient().form('/register', {
      ...account,
      confirmPassword: account.password,
    });

    clients[key] = createClient();
    const login = await clients[key].form('/login', {
      identifier: account.username,
      password: account.password,
    });
    assert.equal(login.status, 302);

    users[key] = await User.findOne({ where: { username: account.username } });
    assert.ok(users[key], `No se creó el usuario ${key}.`);
  }

  for (const slug of ['admin', 'moderator']) {
    const role = await Role.findOne({ where: { slug } });
    assert.ok(role, `No existe el rol ${slug}. Ejecuta "npm run seeds:run".`);
    await UserRole.findOrCreate({
      where: { userId: users[slug].id, roleId: role.id },
    });
  }

  clients.anonymous = createClient();
});

after(async () => {
  const ids = Object.values(users).map((user) => user.id);

  // Al borrar los usuarios se borran sus publicaciones y roles asignados.
  await User.destroy({ where: { id: ids } });
  await Category.destroy({ where: { slug: { [Op.like]: `%${suffix}` } } });
  await Tag.destroy({ where: { slug: { [Op.like]: `%${suffix}` } } });

  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

// Las pruebas de cada bloque dependen del orden: crear -> duplicado -> ...

test('sin sesión, el panel redirige al login', async () => {
  const response = await clients.anonymous.fetch('/admin/categories');

  assert.equal(response.status, 302);
  assert.match(location(response), /^\/login/);
});

test('un miembro sin permisos recibe 403 en categorías y etiquetas', async () => {
  const categories = await clients.member.fetch('/admin/categories');
  const tags = await clients.member.fetch('/admin/tags');

  assert.equal(categories.status, 403);
  assert.equal(tags.status, 403);
});

test('un miembro no puede crear una categoría', async () => {
  const response = await clients.member.form('/admin/categories', {
    name: catName,
  });

  assert.equal(response.status, 403);
  assert.equal(await Category.count({ where: { slug: catSlug } }), 0);
});

test('un moderador gestiona etiquetas pero no categorías', async () => {
  const categories = await clients.moderator.fetch('/admin/categories');
  const tags = await clients.moderator.fetch('/admin/tags');

  assert.equal(categories.status, 403);
  assert.equal(tags.status, 200);
});

test('categorías: el admin crea una y se genera el slug', async () => {
  const response = await clients.admin.form('/admin/categories', {
    name: catName,
    description: 'Categoría de prueba',
  });

  assert.equal(response.status, 302);
  assert.match(location(response), /success=/);

  const category = await Category.findOne({ where: { slug: catSlug } });
  assert.ok(category);
  assert.equal(category.name, catName);
  assert.equal(category.description, 'Categoría de prueba');
});

test('categorías: un nombre repetido no crea otra', async () => {
  const response = await clients.admin.form('/admin/categories', {
    name: catName,
  });

  assert.equal(response.status, 302);
  assert.match(location(response), /Ya existe/);
  assert.equal(await Category.count({ where: { slug: catSlug } }), 1);
});

test('categorías: un nombre distinto con el mismo slug también se rechaza', async () => {
  const response = await clients.admin.form('/admin/categories', {
    name: `cat prueba ${suffix}`,
  });

  assert.equal(response.status, 302);
  assert.match(location(response), /Ya existe/);
  assert.equal(await Category.count({ where: { slug: catSlug } }), 1);
});

test('categorías: un nombre vacío falla la validación', async () => {
  const response = await clients.admin.form('/admin/categories', { name: ' ' });

  assert.equal(response.status, 302);
  assert.match(location(response), /error=/);
});

test('categorías: el admin edita el nombre y el slug se actualiza', async () => {
  const category = await Category.findOne({ where: { slug: catSlug } });
  const newName = `Cat Editada ${suffix}`;

  const response = await clients.admin.form(
    `/admin/categories/${category.id}/edit`,
    { name: newName, description: '' }
  );

  assert.equal(response.status, 302);
  assert.match(location(response), /success=/);

  await category.reload();
  assert.equal(category.name, newName);
  assert.equal(category.slug, `cat-editada-${suffix}`);
});

test('categorías: editar una inexistente devuelve 404', async () => {
  const response = await clients.admin.form('/admin/categories/999999999/edit', {
    name: 'Cualquiera',
  });

  assert.equal(response.status, 404);
});

test('categorías: no se elimina una con publicaciones', async () => {
  categoryInUse = await Category.create({
    name: `Cat En Uso ${suffix}`,
    slug: `cat-en-uso-${suffix}`,
  });
  publication = await Publication.create({
    userId: users.member.id,
    categoryId: categoryInUse.id,
    type: 'dish',
    title: 'Plato para probar categorías',
    description: 'Descripción suficientemente larga para la prueba.',
  });

  const response = await clients.admin.form(
    `/admin/categories/${categoryInUse.id}/delete`,
    {}
  );

  assert.equal(response.status, 302);
  assert.match(location(response), /error=.*tiene 1/);
  assert.ok(await Category.findByPk(categoryInUse.id));
});

test('categorías: se elimina una sin publicaciones', async () => {
  const category = await Category.findOne({
    where: { slug: `cat-editada-${suffix}` },
  });

  const response = await clients.admin.form(
    `/admin/categories/${category.id}/delete`,
    {}
  );

  assert.equal(response.status, 302);
  assert.match(location(response), /success=/);
  assert.equal(await Category.findByPk(category.id), null);
});

test('etiquetas: el moderador crea una y se genera el slug', async () => {
  const response = await clients.moderator.form('/admin/tags', {
    name: tagName,
  });

  assert.equal(response.status, 302);
  assert.match(location(response), /success=/);
  assert.ok(await Tag.findOne({ where: { slug: tagSlug } }));
});

test('etiquetas: un nombre repetido no crea otra', async () => {
  const response = await clients.moderator.form('/admin/tags', {
    name: tagName,
  });

  assert.equal(response.status, 302);
  assert.match(location(response), /Ya existe/);
  assert.equal(await Tag.count({ where: { slug: tagSlug } }), 1);
});

test('etiquetas: el moderador la edita', async () => {
  const tag = await Tag.findOne({ where: { slug: tagSlug } });

  const response = await clients.moderator.form(`/admin/tags/${tag.id}/edit`, {
    name: `Tag Editada ${suffix}`,
  });

  assert.equal(response.status, 302);
  assert.match(location(response), /success=/);

  await tag.reload();
  assert.equal(tag.slug, `tag-editada-${suffix}`);
});

test('etiquetas: eliminar una en uso la quita de las publicaciones', async () => {
  tagInUse = await Tag.findOne({ where: { slug: `tag-editada-${suffix}` } });

  await sequelize.query(
    `INSERT INTO publication_tags (publication_id, tag_id, created_at, updated_at)
     VALUES (:publicationId, :tagId, now(), now())`,
    { replacements: { publicationId: publication.id, tagId: tagInUse.id } }
  );

  const response = await clients.moderator.form(
    `/admin/tags/${tagInUse.id}/delete`,
    {}
  );

  assert.equal(response.status, 302);
  assert.match(location(response), /success=/);
  assert.equal(await Tag.findByPk(tagInUse.id), null);

  const [rows] = await sequelize.query(
    'SELECT count(*)::int AS total FROM publication_tags WHERE tag_id = :tagId',
    { replacements: { tagId: tagInUse.id } }
  );
  assert.equal(rows[0].total, 0);
});

test('etiquetas: eliminar una inexistente devuelve 404', async () => {
  const response = await clients.moderator.form(
    '/admin/tags/999999999/delete',
    {}
  );

  assert.equal(response.status, 404);
});