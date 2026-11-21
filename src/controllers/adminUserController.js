import { Role, User, UserRole } from '../db/models/index.js';
import { httpError } from '../utils/httpError.js';

const ADMIN_SLUG = 'admin';

const backToList = (res, type, message) =>
  res.redirect(`/admin/users?${type}=${encodeURIComponent(message)}`);

const findUser = async (id) => {
  const user = await User.findByPk(id, {
    attributes: ['id', 'firstName', 'lastName', 'username'],
  });

  if (!user) {
    throw httpError(404, 'Usuario no encontrado.');
  }

  return user;
};

const findRole = async (id) => {
  const roleId = Number(id);

  if (!Number.isInteger(roleId) || roleId < 1) {
    return null;
  }

  return Role.findByPk(roleId);
};

export const listUsers = async (req, res) => {
  const [users, roles] = await Promise.all([
    User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'username', 'email'],
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] },
        },
      ],
      order: [['id', 'ASC']],
    }),
    Role.findAll({
      attributes: ['id', 'name', 'slug'],
      order: [['name', 'ASC']],
    }),
  ]);

  return res.render('admin/users', {
    title: 'Usuarios y roles',
    users: users.map((user) => user.get({ plain: true })),
    roles: roles.map((role) => role.get({ plain: true })),
  });
};

export const assignRole = async (req, res) => {
  const user = await findUser(req.params.id);
  const role = await findRole(req.body.roleId);

  if (!role) {
    return backToList(res, 'error', 'Selecciona un rol válido.');
  }

  // findOrCreate evita el error de la restricción única (user_id, role_id):
  // asignar un rol que el usuario ya tiene no cambia nada y no falla.
  const [, created] = await UserRole.findOrCreate({
    where: { userId: user.id, roleId: role.id },
  });

  if (!created) {
    return backToList(
      res,
      'success',
      `${user.firstName} ya tenía el rol ${role.name}. No se hizo ningún cambio.`
    );
  }

  return backToList(
    res,
    'success',
    `Rol ${role.name} asignado a ${user.firstName} ${user.lastName}.`
  );
};

export const removeRole = async (req, res) => {
  const user = await findUser(req.params.id);
  const role = await findRole(req.params.roleId);

  if (!role) {
    throw httpError(404, 'Rol no encontrado.');
  }

  const link = await UserRole.findOne({
    where: { userId: user.id, roleId: role.id },
  });

  if (!link) {
    return backToList(
      res,
      'error',
      `${user.firstName} no tiene el rol ${role.name}.`
    );
  }

  if (role.slug === ADMIN_SLUG) {
    if (user.id === req.currentUser.id) {
      return backToList(
        res,
        'error',
        'No puedes quitarte tu propio rol de administrador.'
      );
    }

    // Red de seguridad: hoy solo un admin puede llegar aquí, pero si en el
    // futuro otro rol recibe "roles:manage" el sistema no debe quedar sin admin.
    const adminCount = await UserRole.count({ where: { roleId: role.id } });

    if (adminCount <= 1) {
      return backToList(res, 'error', 'Debe quedar al menos un administrador.');
    }
  }

  const roleCount = await UserRole.count({ where: { userId: user.id } });

  if (roleCount <= 1) {
    return backToList(
      res,
      'error',
      `${user.firstName} debe conservar al menos un rol. Asigna otro antes de quitar ${role.name}.`
    );
  }

  await UserRole.destroy({ where: { userId: user.id, roleId: role.id } });

  return backToList(
    res,
    'success',
    `Rol ${role.name} quitado a ${user.firstName} ${user.lastName}.`
  );
};
