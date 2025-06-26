import i18next from 'i18next';
import { ValidationError } from 'objection';
import { userGuard } from './guards.js';

export const statusesPaths = {
  statuses: () => '/statuses',
  createStatus: () => `${statusesPaths.statuses()}/new`,
  editDeleteStatus: (id) => `${statusesPaths.statuses()}/${id ?? ':id'}`,
  editStatus: (id) => `${statusesPaths.editDeleteStatus(id)}/edit`,
};

const statusErrors = (e) => Object.keys(e.data).reduce((object, key) => ({ ...object, key: `${i18next.t('layout.errorIn')} ${i18next.t(`statuses.${key}`)}` }), {});

export default (app) => {
  app.get(statusesPaths.createStatus(), userGuard(), async (req, res) => res.render('createStatus.pug'));

  app.post(statusesPaths.statuses(), userGuard(), async (req, res) => {
    try {
      const validStatus = app.models.status.fromJson(req.body.data);
      await app.models.status.query().insert(validStatus);
      req.flash('success', i18next.t('statuses.createSuccess'));
      return res.redirect(statusesPaths.statuses());
    } catch (e) {
      const status = new app.models.status();
      status.$set(req.body.data);
      res.code(400);
      req.flash('warning', i18next.t('statuses.createFail'));
      if (e instanceof ValidationError) {
        return res.render('createStatus.pug', { status, errors: statusErrors(e) });
      }
      console.warn(e);
      return res.render('createStatus.pug', { status });
    }
  });

  app.get(statusesPaths.statuses(), userGuard(), async (_, res) => {
    const statuses = await app.models.status.query()
      .select('id', 'name', 'createDate')
      .orderBy('id');

    return res.render('statuses.pug', { statuses });
  });

  app.get(statusesPaths.editStatus(':id'), userGuard(), async (req, res) => {
    const status = await app.models.status.query().findById(req.params.id);
    if (!status) return res.callNotFound();
    return res.render('editStatus.pug', { status });
  });

  app.patch(statusesPaths.editDeleteStatus(':id'), userGuard(), async (req, res) => {
    try {
      const validStatus = app.models.status.fromJson(req.body.data);
      await app.models.status.query().update(validStatus).where('id', req.params.id);
      req.flash('success', i18next.t('statuses.editSuccess'));
      return res.redirect(statusesPaths.statuses());
    } catch (e) {
      const status = new app.models.status();
      status.$set(req.body.data);
      res.code(400);
      req.flash('warning', i18next.t('statuses.editFail'));
      if (e instanceof ValidationError) {
        return res.render('editStatus.pug', { status, errors: statusErrors(e) });
      }

      console.warn(e);
      return res.render('editStatus.pug', { status });
    }
  });

  app.delete(statusesPaths.editDeleteStatus(':id'), userGuard(), async (req, res) => {
    try {
      await app.models.status.query().deleteById(req.params.id);
      req.flash('info', i18next.t('statuses.deleteSuccess'));
      return res.redirect(statusesPaths.statuses());
    } catch {
      return res.callNotFound();
    }
  });
};
