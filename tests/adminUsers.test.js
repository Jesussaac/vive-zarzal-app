import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { sequelize } from '../src/libraries/DBConnection.js';
import { Role, User, UserRole } from '../src/db/models/index.js';
import { signToken } from '../src/utils/auth.js';

const suffix = Date.now().toString().slice(-9);

let server;
let baseUrl;
const roles = {};
const users = {};
const cookies = {};

const location = (response) => response.headers.get('location') || '';

const get = (route, as) =>
  fetch(`${baseUrl}${route}`, {
    headers: as ? { cookie: cookies[as] } : {},
    redirect: 'manual',
  });

const post = (route, data = {}, as) =>
  fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      ...(as ? { cookie: cookies[as] } : {}),
    },
    body: new URLSearchParams(data).toString(),
    redirect: 'manual',
  });

const rolesOf = async (user) =>
  (await UserRole.findAll({ where: { userId: user.id } })).map(
    (link) => link.roleId
  );

before(async () => {
  await sequelize.authenticate();

  for (const slug of ['admin', 'moderator', 'member']) {
    roles[slug] = await Role.findOne({ where: { slug } });
    assert.ok(
      roles[slug],
      'No hay roles. Ejecuta "npm run migrations:run" y "npm run seeds:run".'
    );
  }

  // admin: quien usa el panel. target: usuario sobre el que se prueban los roles.
  const definitions = {
    admin: 'admin',
    moderator: 'moderator',
    member: 'member',
    target: 'member',
  };

  for (const [name, roleSlug] of Object.entries(definitions)) {
    const user = await User.create({
      firstName: 'Roles',
      lastName: name,
      username: `roles_${name}_${suffix}`,
      email: `roles_${name}_${suffix}@example.com`,
      password: 'no-se-usa-en-estas-pruebas',
    });
    await user.addRole(roles[roleSlug]);

    users[name] = user;
    cookies[name] = `authentication=${signToken(user)}`;
  }

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await User.destroy({
    where: { id: Object.values(users).map((user) => user.id) },
  });

  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

test('panel de roles: acceso según sesión y rol', async (t) => {
  await t.test('sin sesión redirige al login', async () => {
    const response = await get('/admin/users');

    assert.equal(response.status, 302);
    assert.match(location(response), /^\/login\?next=/);
  });

  await t.test('member y moderator reciben 403', async () => {
    assert.equal((await get('/admin/users', 'member')).status, 403);
    assert.equal((await get('/admin/users', 'moderator')).status, 403);
  });

  await t.test('admin ve el listado con los usuarios', async () => {
    const response = await get('/admin/users', 'admin');
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, new RegExp(users.target.username));
  });

  await t.test('un member no puede asignar roles por POST', async () => {
    const response = await post(
      `/admin/users/${users.target.id}/roles`,
      { roleId: String(roles.moderator.id) },
      'member'
    );

    assert.equal(response.status, 403);
    assert.ok(!(await rolesOf(users.target)).includes(roles.moderator.id));
  });
});

test('panel de roles: asignar y quitar roles', async (t) => {
  await t.test('el admin asigna un rol', async () => {
    const response = await post(
      `/admin/users/${users.target.id}/roles`,
      { roleId: String(roles.moderator.id) },
      'admin'
    );

    assert.equal(response.status, 302);
    assert.match(location(response), /^\/admin\/users\?success=/);
    assert.ok((await rolesOf(users.target)).includes(roles.moderator.id));
  });

  await t.test('asignar un rol repetido no falla ni duplica', async () => {
    const response = await post(
      `/admin/users/${users.target.id}/roles`,
      { roleId: String(roles.moderator.id) },
      'admin'
    );

    assert.equal(response.status, 302);
    assert.match(location(response), /^\/admin\/users\?success=/);
    assert.equal(
      await UserRole.count({
        where: { userId: users.target.id, roleId: roles.moderator.id },
      }),
      1
    );
  });

  await t.test('un rol inválido se rechaza con un mensaje', async () => {
    const response = await post(
      `/admin/users/${users.target.id}/roles`,
      { roleId: 'abc' },
      'admin'
    );

    assert.equal(response.status, 302);
    assert.match(location(response), /^\/admin\/users\?error=/);
  });

  await t.test('un usuario inexistente responde 404', async () => {
    const response = await post(
      '/admin/users/999999999/roles',
      { roleId: String(roles.moderator.id) },
      'admin'
    );

    assert.equal(response.status, 404);
  });

  await t.test('el admin quita un rol si el usuario conserva otro', async () => {
    const response = await post(
      `/admin/users/${users.target.id}/roles/${roles.moderator.id}/delete`,
      {},
      'admin'
    );

    assert.equal(response.status, 302);
    assert.match(location(response), /^\/admin\/users\?success=/);
    assert.deepEqual(await rolesOf(users.target), [roles.member.id]);
  });

  await t.test('no se puede quitar el único rol de un usuario', async () => {
    const response = await post(
      `/admin/users/${users.target.id}/roles/${roles.member.id}/delete`,
      {},
      'admin'
    );

    assert.equal(response.status, 302);
    assert.match(location(response), /^\/admin\/users\?error=/);
    assert.deepEqual(await rolesOf(users.target), [roles.member.id]);
  });

  await t.test('quitar un rol que el usuario no tiene muestra un aviso', async () => {
    const response = await post(
      `/admin/users/${users.target.id}/roles/${roles.admin.id}/delete`,
      {},
      'admin'
    );

    assert.equal(response.status, 302);
    assert.match(location(response), /^\/admin\/users\?error=/);
  });
});

test('panel de roles: protección del administrador', async (t) => {
  await t.test('un admin no puede quitarse su propio rol admin', async () => {
    // Se le agrega member para que la regla de "al menos un rol" no interfiera.
    await users.admin.addRole(roles.member);

    const response = await post(
      `/admin/users/${users.admin.id}/roles/${roles.admin.id}/delete`,
      {},
      'admin'
    );

    assert.equal(response.status, 302);
    assert.match(location(response), /^\/admin\/users\?error=/);
    assert.ok((await rolesOf(users.admin)).includes(roles.admin.id));
  });
});
