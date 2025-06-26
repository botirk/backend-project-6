import i18next from 'i18next';
import { ValidationError } from 'objection';
import { mainPaths } from './main.js';
import { userGuard } from './guards.js';

export const usersPaths = {
  users: () => '/users',
  signUp: () => `${usersPaths.users()}/new`,
  editDeleteUser: (id) => `${usersPaths.users()}/${id ?? ':id'}`,
  editUser: (id) => `${usersPaths.editDeleteUser(id)}/edit`,
};

const userErrors = (e) => Object.keys(e.data).reduce((object, key) => ({ ...object, [key]: `${i18next.t('layout.errorIn')} ${i18next.t(`signUp.${key}`)}` }), {});

export default (app) => {
  app.get(usersPaths.signUp(), (_, res) => {
    res.render('signUp.pug');
  });

  app.post(usersPaths.users(), async (req, res) => {
    try {
      const validUser = app.models.user.fromJson(req.body.data);
      await app.models.user.query().insert(validUser);
      req.flash('success', i18next.t('signUp.success'));
      return res.redirect(mainPaths.main());
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

  app.get(usersPaths.users(), async (_, res) => {
    const users = await app.models.user.query()
      .select('firstName', 'lastName', 'email', 'id', 'createDate')
      .orderBy('id');

    return res.render('users.pug', { users });
  });

  app.get(usersPaths.editUser(':id'), userGuard(true), async (req, res) => res.render('editUser.pug', { user: { ...req.user, password: '' } }));

  app.patch(usersPaths.editDeleteUser(':id'), userGuard(true), async (req, res) => {
    try {
      const validUser = app.models.user.fromJson(req.body.data);
      await app.models.user.query().update(validUser).where('id', req.user.id);
      req.flash('success', i18next.t('editUser.success'));
      return res.redirect(usersPaths.users());
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

  app.delete(usersPaths.editDeleteUser(':id'), userGuard(true), async (req, res) => {
    await app.models.user.query().deleteById(req.user.id);
    await req.logOut();
    req.flash('info', i18next.t('editUser.deleted'));
    return res.redirect(usersPaths.users());
  });
};
