import i18next from 'i18next';
import { mainPaths } from './main.js';

const session = () => '/session';
const login = () => `${session()}/new`;
export const sessionPaths = { session, login };

export default (app) => {
  app.get(sessionPaths.login(), (_, res) => {
    res.render('login.pug');
  });

  app.post(sessionPaths.session(), async (req, res) => {
    // eslint-disable-next-line
    if (req.user && req.body._method === 'delete') {
      await req.logOut();
      req.flash('info', i18next.t('layout.logoutSuccess'));
      return res.redirect(mainPaths.main());
    }
    if (req.user) {
      return res.redirect(mainPaths.main());
    }

    // eslint-disable-next-line
    return await new Promise(async (resolve, reject) => {
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
