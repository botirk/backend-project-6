import i18next from 'i18next';
import { ForeignKeyViolationError, ValidationError } from 'objection';
// eslint-disable-next-line
import { paths } from './index.js';
import { userGuard } from './guards.js';

const labelErrors = (e) => Object.keys(e.data).reduce((object, key) => {
  // eslint-disable-next-line
  object[key] = `${i18next.t('layout.errorIn')} ${i18next.t(`labels.${key}`)}`
  return object;
}, {});

export default (app) => {
  app.get(paths.createLabel(), userGuard(), async (req, res) => res.render('createLabel.pug'));

  app.post(paths.labels(), userGuard(), async (req, res) => {
    try {
      const validLabel = app.models.label.fromJson(req.body.data);
      await app.models.label.query().insert(validLabel);
      req.flash('success', i18next.t('labels.createSuccess'));
      return res.redirect(paths.labels());
    } catch (e) {
      const label = new app.models.label();
      label.$set(req.body.data);
      res.code(400);
      req.flash('warning', i18next.t('labels.createFail'));
      if (e instanceof ValidationError) {
        return res.render('createLabel.pug', { label, errors: labelErrors(e) });
      }

      console.warn(e);
      req.flash('warning', i18next.t('layout.error'));
      return res.render('createLabel.pug', { label });
    }
  });

  app.get(paths.labels(), userGuard(), async (_, res) => {
    const labels = await app.models.label.query()
      .select('id', 'name', 'createDate')
      .orderBy('id');

    return res.render('labels.pug', { labels });
  });

  app.get(paths.editLabel(':id'), userGuard(), async (req, res) => {
    const label = await app.models.label.query().findById(req.params.id);
    if (!label) {
      req.flash('warning', i18next.t('layout.404'));
      return res.redirect(paths.labels());
    }
    return res.render('editLabel.pug', { label });
  });

  app.post(paths.editDeleteLabel(':id'), userGuard(), async (req, res) => {
    // eslint-disable-next-line
    if (req.body._method === 'patch') {
      try {
        const validLabel = app.models.label.fromJson(req.body.data);
        await app.models.label.query().update(validLabel).where('id', req.params.id);
        req.flash('success', i18next.t('labels.editSuccess'));
        return res.redirect(paths.labels());
      } catch (e) {
        const label = new app.models.label();
        label.$set(req.body.data);
        res.code(400);
        req.flash('warning', i18next.t('labels.editFail'));
        if (e instanceof ValidationError) {
          return res.render('editLabel.pug', { label, errors: labelErrors(e) });
        }

        console.warn(e);
        return res.render('editLabel.pug', { label });
      }
    // eslint-disable-next-line
    } else if (req.body._method === 'delete') {
      try {
        await app.models.label.query().deleteById(req.params.id);
        req.flash('info', i18next.t('labels.deleteSuccess'));
        return res.redirect(paths.labels());
      } catch (e) {
        console.warn(e);
        if (e instanceof ForeignKeyViolationError) {
          req.flash('warning', i18next.t('tasks.deleteLinkedResource'));
          return res.redirect(paths.labels());
        }

        return res.callNotFound();
      }
    } else {
      return res.callNotFound();
    }
  });
};
