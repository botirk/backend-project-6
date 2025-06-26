import i18next from 'i18next';
import { mainPaths } from './main.js';
import { userGuard } from './guards.js';

const session = () => '/session';
const login = () => `${session()}/new`;
export const sessionPaths = { session, login };

export default (app) => {
  app.get(sessionPaths.login(), (_, res) => {
    res.render('login.pug');
  });

  app.delete(sessionPaths.session(), userGuard(), async (req, res) => {
    await req.logOut();
    req.flash('info', i18next.t('layout.logoutSuccess'));
    return res.redirect(mainPaths.main());
  });

  app.post(sessionPaths.session(), (req, res) => {
    if (req.user) return res.redirect(mainPaths.main());

    return new Promise((resolve, reject) => {
      app.passport.authenticate('form', async (_1, _2, _3, user) => {
        try {
          if (!user) {
            req.flash('warning', i18next.t('login.error'));
            resolve(res.code(401).render('login.pug', { user: req.body.data, error: true }));
          } else {
            await req.logIn(user);
            req.flash('success', i18next.t('login.success'));
            resolve(res.redirect(mainPaths.main()));
          }
        } catch (e) {
          reject(e);
        }
      })(req, res);
    });
  });
};
