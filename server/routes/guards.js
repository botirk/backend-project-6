import i18next from 'i18next';
import { mainPaths } from './main.js';

export const userGuard = (paramsIdIsUser = false) => ({
  preValidation: (req, res, done) => {
    if (!req.user || (paramsIdIsUser && parseInt(req.params.id, 10) !== req.user.id)) {
      req.flash('danger', i18next.t('layout.401'));
      return res.redirect(mainPaths.main());
    }

    done();
    return undefined;
  },
});

export default userGuard;
