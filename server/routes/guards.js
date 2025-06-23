import i18next from 'i18next';
// eslint-disable-next-line
import { mainPaths } from './main.js';

// eslint-disable-next-line
export const userGuard = () => ({
  // eslint-disable-next-line
  preValidation: (req, res, done) => {
    if (!req.user) {
      req.flash('danger', i18next.t('layout.401'));
      return res.redirect(mainPaths.main());
    }

    done();
  },
});
