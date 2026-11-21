import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { sequelize } from '../src/libraries/DBConnection.js';
import {
  Category,
  Comment,
  Publication,
  Report,
  Role,
  User,
} from '../src/db/models/index.js';
import { signToken } from '../src/utils/auth.js';

const suffix = Date.now().toString().slice(-9);

let server;
let baseUrl;
let category;
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

before(async () => {
  await sequelize.authenticate();

  for (const slug of ['admin', 'moderator', 'member']) {
    roles[slug] = await Role.findOne({ where: { slug } });
    assert.ok(
      roles[slug],
      'No hay roles. Ejecuta "npm run migrations:run" y "npm run seeds:run".'
    );
  }

  category = await Category.findOne();
  assert.ok(category, 'No hay categorías sembradas.');

  for (const [name, roleSlug] of Object.entries({
    admin: 'admin',
    moderator: 'moderator',
    member: 'member',
    author: 'member',
  })) {
    const user = await User.create({
      firstName: 'Mod',
      lastName: name,
      username: `mod_${name}_${suffix}`,
      email: `mod_${name}_${suffix}@example.com`,
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

test('cola de reportes: control de acceso', async (t) => {
  await t.test('sin sesión redirige a login', async () => {
    const res = await get('/admin/reports');
    assert.equal(res.status, 302);
    assert.match(location(res), /^\/login\?next=/);
  });

  await t.test('member recibe 403 en listado y acciones', async () => {
    assert.equal((await get('/admin/reports', 'member')).status, 403);
    assert.equal((await post('/admin/reports/1/approve', {}, 'member')).status, 403);
    assert.equal((await post('/admin/reports/1/dismiss', {}, 'member')).status, 403);
  });

  await t.test('moderator y admin acceden a la cola', async () => {
    assert.equal((await get('/admin/reports', 'moderator')).status, 200);
    assert.equal((await get('/admin/reports', 'admin')).status, 200);
  });
});

test('cola de reportes: flujo aprobar, descartar y bloqueo de re-revisión', async (t) => {
  let reportedPub;
  let pubReport;
  let commentReport;
  let reportedComment;

  await t.test('aprobar reporte oculta publicación, registra revisor y bloquea re-revisión', async () => {
    reportedPub = await Publication.create({
      userId: users.author.id,
      categoryId: category.id,
      type: 'dish',
      title: `Plato reportado ${suffix}`,
      description: 'Contenido ofensivo de prueba',
    });

    pubReport = await Report.create({
      reporterId: users.member.id,
      publicationId: reportedPub.id,
      reason: 'spam',
      details: 'Es spam evidente',
      status: 'pending',
    });

    const detailRes = await get(`/admin/reports/${pubReport.id}`, 'moderator');
    const detailHtml = await detailRes.text();
    assert.equal(detailRes.status, 200);
    assert.match(detailHtml, new RegExp(reportedPub.title));

    const approveRes = await post(
      `/admin/reports/${pubReport.id}/approve`,
      {},
      'moderator'
    );
    assert.equal(approveRes.status, 302);
    assert.match(location(approveRes), /success=/);

    await pubReport.reload();
    await reportedPub.reload();

    assert.equal(pubReport.status, 'approved');
    assert.equal(pubReport.reviewedBy, users.moderator.id);
    assert.ok(pubReport.reviewedAt instanceof Date);
    assert.equal(reportedPub.isHidden, true);

    assert.equal((await get(`/publications/${reportedPub.id}`)).status, 404);

    const secondAttempt = await post(
      `/admin/reports/${pubReport.id}/dismiss`,
      {},
      'admin'
    );
    assert.equal(secondAttempt.status, 302);
    assert.match(location(secondAttempt), /error=/);

    await pubReport.reload();
    assert.equal(pubReport.status, 'approved');
  });

  await t.test('descartar reporte de comentario mantiene el comentario visible', async () => {
    const cleanPub = await Publication.create({
      userId: users.author.id,
      categoryId: category.id,
      type: 'dish',
      title: `Plato limpio ${suffix}`,
      description: 'Descripción válida',
    });

    reportedComment = await Comment.create({
      userId: users.author.id,
      publicationId: cleanPub.id,
      content: `Comentario válido ${suffix}`,
    });

    commentReport = await Report.create({
      reporterId: users.member.id,
      commentId: reportedComment.id,
      reason: 'other',
      status: 'pending',
    });

    const dismissRes = await post(
      `/admin/reports/${commentReport.id}/dismiss`,
      {},
      'admin'
    );
    assert.equal(dismissRes.status, 302);

    await commentReport.reload();
    await reportedComment.reload();

    assert.equal(commentReport.status, 'dismissed');
    assert.equal(commentReport.reviewedBy, users.admin.id);
    assert.ok(commentReport.reviewedAt instanceof Date);
    assert.equal(reportedComment.isHidden, false);

    const dismissedList = await get('/admin/reports?status=dismissed', 'moderator');
    const html = await dismissedList.text();
    assert.equal(dismissedList.status, 200);
    assert.match(html, new RegExp(reportedComment.content));
  });
});
