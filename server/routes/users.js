import i18next from 'i18next';
import { ValidationError } from 'objection';
// eslint-disable-next-line
import { paths } from './index.js';

const userErrors = (e) => Object.keys(e.data).reduce((object, key) => {
  // eslint-disable-next-line
  object[key] = `${i18next.t('layout.errorIn')} ${i18next.t(`signUp.${key}`)}`;
  return object;
}, {});

export default (app) => {
  app.get(paths.signUp(), (_, res) => {
    res.render('signUp.pug');
  });

  app.post(paths.users(), async (req, res) => {
    try {
      const validUser = app.models.user.fromJson(req.body.data);
      await app.models.user.query().insert(validUser);
      req.flash('success', i18next.t('signUp.success'));
      return res.redirect(paths.main());
    } catch (e) {
      const user = new app.models.user();
      user.$set(req.body.data);
      res.code(400);
      req.flash('warning', i18next.t('signUp.fail'));
      if (e instanceof ValidationError) {
        return res.render('signUp.pug', { user, errors: userErrors(e) });
      }

      console.warn(e);
      return res.render('signUp.pug', { user });
    }
  });

  app.get(paths.users(), async (_, res) => {
    const users = await app.models.user.query()
      .select('firstName', 'lastName', 'email', 'id', 'createDate')
      .orderBy('id');

    return res.render('users.pug', { users });
  });

  app.get(paths.editUser(':id'), async (req, res) => {
    // eslint-disable-next-line
    if (req.params.id != req.user?.id) {
      req.flash('danger', i18next.t('layout.401'));
      return res.redirect(paths.users());
    }
    return res.render('editUser.pug', { user: { ...req.user, password: '' } });
  });

  app.post(paths.editDeleteUser(':id'), async (req, res) => {
    // eslint-disable-next-line
    if (req.params.id != req.user?.id) {
      req.flash('danger', i18next.t('layout.401'));
      return res.redirect(paths.users());
    }
    // eslint-disable-next-line
    if (req.body._method === 'delete') {
      await app.models.user.query().deleteById(req.user.id);
      await req.logOut();
      req.flash('info', i18next.t('editUser.deleted'));
      return res.redirect(paths.users());
    }

    try {
      const validUser = app.models.user.fromJson(req.body.data);
      await app.models.user.query().update(validUser).where('id', req.user.id);
      req.flash('success', i18next.t('editUser.success'));
      return res.redirect(paths.users());
    } catch (e) {
      const user = new app.models.user();
      user.$set(req.body.data);
      res.code(400);
      if (e instanceof ValidationError) {
        return res.render('editUser.pug', { user: { ...req.user, ...user }, errors: userErrors(e) });
      }

      req.flash('warning', i18next.t('layout.error'));
      return res.render('editUser.pug', { user: { ...req.user, ...user } });
    }
  });
};
