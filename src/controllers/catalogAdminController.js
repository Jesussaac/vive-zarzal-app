import { Op, ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';
import { Category, Publication, Tag } from '../db/models/index.js';
import { categorySchema, firstError, tagSchema } from '../schemas/index.js';
import { httpError } from '../utils/httpError.js';
import { slugify } from '../utils/slugify.js';

const redirectWith = (res, path, type, message) =>
  res.redirect(`${path}?${type}=${encodeURIComponent(message)}`);

const buildCatalogHandlers = ({
  Model,
  schema,
  basePath,
  label,
  hasDescription,
  countUsage,
}) => {
  const duplicateMessage = `Ya existe una ${label.singular} con ese nombre.`;
  const inUseMessage = (count) =>
    `No puedes eliminar esta ${label.singular}: tiene ${count} publicación(es) asociada(s).`;

  const parse = (body) => {
    const input = { name: body.name };

    if (hasDescription) {
      input.description = body.description;
    }

    const { error, value } = schema.validate(input, { abortEarly: false });

    if (error) {
      return { message: firstError(error) };
    }

    const slug = slugify(value.name);

    if (!slug) {
      return { message: 'El nombre debe contener letras o números.' };
    }

    return { value, slug };
  };

  const buildData = ({ value, slug }) => ({
    name: value.name,
    slug,
    ...(hasDescription && { description: value.description || null }),
  });

  const findDuplicate = ({ value, slug }, ignoreId) =>
    Model.findOne({
      where: {
        [Op.or]: [{ name: value.name }, { slug }],
        ...(ignoreId && { id: { [Op.ne]: ignoreId } }),
      },
    });

  const findOr404 = async (id) => {
    const item = await Model.findByPk(id);

    if (!item) {
      throw httpError(404, `${label.title} no encontrada.`);
    }

    return item;
  };

  return {
    list: async (req, res) => {
      const items = await Model.findAll({ order: [['name', 'ASC']] });

      return res.render('adminCatalog', {
        title: `Administrar ${label.plural}`,
        items,
        basePath,
        label,
        hasDescription,
      });
    },

    create: async (req, res) => {
      const parsed = parse(req.body);

      if (parsed.message) {
        return redirectWith(res, basePath, 'error', parsed.message);
      }

      if (await findDuplicate(parsed)) {
        return redirectWith(res, basePath, 'error', duplicateMessage);
      }

      try {
        await Model.create(buildData(parsed));
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          return redirectWith(res, basePath, 'error', duplicateMessage);
        }
        throw error;
      }

      return redirectWith(res, basePath, 'success', `${label.title} creada.`);
    },

    update: async (req, res) => {
      const item = await findOr404(req.params.id);
      const parsed = parse(req.body);

      if (parsed.message) {
        return redirectWith(res, basePath, 'error', parsed.message);
      }

      if (await findDuplicate(parsed, item.id)) {
        return redirectWith(res, basePath, 'error', duplicateMessage);
      }

      try {
        await item.update(buildData(parsed));
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          return redirectWith(res, basePath, 'error', duplicateMessage);
        }
        throw error;
      }

      return redirectWith(res, basePath, 'success', `${label.title} actualizada.`);
    },

    remove: async (req, res) => {
      const item = await findOr404(req.params.id);

      if (countUsage) {
        const count = await countUsage(item);

        if (count > 0) {
          return redirectWith(res, basePath, 'error', inUseMessage(count));
        }
      }

      try {
        await item.destroy();
      } catch (error) {
        // Respaldo: la base de datos también protege con la FK RESTRICT.
        if (error instanceof ForeignKeyConstraintError) {
          return redirectWith(
            res,
            basePath,
            'error',
            `No puedes eliminar esta ${label.singular} porque está en uso.`
          );
        }
        throw error;
      }

      return redirectWith(res, basePath, 'success', `${label.title} eliminada.`);
    },
  };
};

export const categoryAdmin = buildCatalogHandlers({
  Model: Category,
  schema: categorySchema,
  basePath: '/admin/categories',
  label: { title: 'Categoría', singular: 'categoría', plural: 'categorías' },
  hasDescription: true,
  countUsage: (category) =>
    Publication.count({ where: { categoryId: category.id } }),
});

export const tagAdmin = buildCatalogHandlers({
  Model: Tag,
  schema: tagSchema,
  basePath: '/admin/tags',
  label: { title: 'Etiqueta', singular: 'etiqueta', plural: 'etiquetas' },
  hasDescription: false,
});