import { sequelize } from '../libraries/DBConnection.js';
import { Comment, Publication, Report, User } from '../db/models/index.js';
import { REPORT_REASON_LABELS } from '../schemas/index.js';
import { httpError } from '../utils/httpError.js';

const VALID_STATUSES = ['pending', 'approved', 'dismissed'];

const STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  dismissed: 'Descartado',
};

const reportDetailInclude = [
  {
    model: User,
    as: 'reporter',
    attributes: ['id', 'firstName', 'lastName', 'username', 'email'],
  },
  {
    model: User,
    as: 'reviewer',
    attributes: ['id', 'firstName', 'lastName', 'username'],
  },
  {
    model: Publication,
    as: 'publication',
    attributes: ['id', 'title', 'description', 'imageUrl', 'type', 'isHidden', 'createdAt'],
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName', 'username'],
      },
    ],
  },
  {
    model: Comment,
    as: 'comment',
    attributes: ['id', 'content', 'publicationId', 'isHidden', 'createdAt'],
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName', 'username'],
      },
      {
        model: Publication,
        as: 'publication',
        attributes: ['id', 'title'],
      },
    ],
  },
];

const findReportOr404 = async (id) => {
  const reportId = Number(id);

  if (!Number.isInteger(reportId) || reportId < 1) {
    throw httpError(404, 'Reporte no encontrado.');
  }

  const report = await Report.findByPk(reportId, {
    include: reportDetailInclude,
  });

  if (!report) {
    throw httpError(404, 'Reporte no encontrado.');
  }

  return report;
};

export const listReports = async (req, res) => {
  const requestedStatus = String(req.query.status || 'pending');
  const currentStatus = VALID_STATUSES.includes(requestedStatus)
    ? requestedStatus
    : 'pending';

  const [reports, pendingCount, approvedCount, dismissedCount] =
    await Promise.all([
      Report.findAll({
        where: { status: currentStatus },
        include: reportDetailInclude,
        order: [['createdAt', currentStatus === 'pending' ? 'ASC' : 'DESC']],
      }),
      Report.count({ where: { status: 'pending' } }),
      Report.count({ where: { status: 'approved' } }),
      Report.count({ where: { status: 'dismissed' } }),
    ]);

  return res.render('admin/reports', {
    title: 'Cola de reportes',
    reports: reports.map((report) => report.get({ plain: true })),
    currentStatus,
    counts: {
      pending: pendingCount,
      approved: approvedCount,
      dismissed: dismissedCount,
    },
    statusLabels: STATUS_LABELS,
    reasonLabels: REPORT_REASON_LABELS,
  });
};

export const showReport = async (req, res) => {
  const report = await findReportOr404(req.params.id);

  return res.render('admin/reportDetail', {
    title: `Reporte #${report.id}`,
    report: report.get({ plain: true }),
    statusLabels: STATUS_LABELS,
    reasonLabels: REPORT_REASON_LABELS,
  });
};

export const approveReport = async (req, res) => {
  const report = await findReportOr404(req.params.id);

  if (report.status !== 'pending') {
    return res.redirect(
      `/admin/reports/${report.id}?error=${encodeURIComponent('Este reporte ya fue revisado.')}`
    );
  }

  await sequelize.transaction(async (transaction) => {
    await report.update(
      {
        status: 'approved',
        reviewedBy: req.currentUser.id,
        reviewedAt: new Date(),
      },
      { transaction }
    );

    if (report.publicationId) {
      await Publication.update(
        { isHidden: true },
        { where: { id: report.publicationId }, transaction }
      );
    } else if (report.commentId) {
      await Comment.update(
        { isHidden: true },
        { where: { id: report.commentId }, transaction }
      );
    }
  });

  return res.redirect(
    `/admin/reports?status=pending&success=${encodeURIComponent('Reporte aprobado y contenido ocultado.')}`
  );
};

export const dismissReport = async (req, res) => {
  const report = await findReportOr404(req.params.id);

  if (report.status !== 'pending') {
    return res.redirect(
      `/admin/reports/${report.id}?error=${encodeURIComponent('Este reporte ya fue revisado.')}`
    );
  }

  await report.update({
    status: 'dismissed',
    reviewedBy: req.currentUser.id,
    reviewedAt: new Date(),
  });

  return res.redirect(
    `/admin/reports?status=pending&success=${encodeURIComponent('Reporte descartado.')}`
  );
};
