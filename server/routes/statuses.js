import i18next from 'i18next';
import { ValidationError } from 'objection';
// eslint-disable-next-line
import { paths } from './index.js';
// eslint-disable-next-line
import { userGuard } from './guards.js';

const statusErrors = (e) => Object.keys(e.data).reduce((object, key) => {
  // eslint-disable-next-line
  object[key] = `${i18next.t('layout.errorIn')} ${i18next.t(`statuses.${key}`)}`
  return object;
}, {});

export default (app) => {
  app.get(paths.createStatus(), userGuard(), async (req, res) => res.render('createStatus.pug'));

  app.post(paths.statuses(), userGuard(), async (req, res) => {
    try {
      const validStatus = app.models.status.fromJson(req.body.data);
      await app.models.status.query().insert(validStatus);
      req.flash('success', i18next.t('statuses.createSuccess'));
      return res.redirect(paths.statuses());
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

  app.get(paths.statuses(), userGuard(), async (_, res) => {
    const statuses = await app.models.status.query()
      .select('id', 'name', 'createDate')
      .orderBy('id');

    return res.render('statuses.pug', { statuses });
  });

  app.get(paths.editStatus(':id'), userGuard(), async (req, res) => {
    const status = await app.models.status.query().findById(req.params.id);
    if (!status) return res.callNotFound();
    return res.render('editStatus.pug', { status });
  });

  app.post(paths.editDeleteStatus(':id'), userGuard(), async (req, res) => {
    // eslint-disable-next-line
    if (req.body._method === 'patch') {
      try {
        const validStatus = app.models.status.fromJson(req.body.data);
        await app.models.status.query().update(validStatus).where('id', req.params.id);
        req.flash('success', i18next.t('statuses.editSuccess'));
        return res.redirect(paths.statuses());
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
    // eslint-disable-next-line
    } else if (req.body._method === 'delete') {
      try {
        await app.models.status.query().deleteById(req.params.id);
        req.flash('info', i18next.t('statuses.deleteSuccess'));
        return res.redirect(paths.statuses());
      } catch {
        return res.callNotFound();
      }
    } else {
      return res.callNotFound();
    }
  });
};
