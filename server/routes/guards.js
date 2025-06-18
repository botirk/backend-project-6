import i18next from 'i18next'
import { paths } from './index.js'

export const userGuard = () => ({
  preValidation: (req, res, done) => {
    if (!req.user) {
      req.flash('danger', i18next.t('layout.401'))
      return res.redirect(paths.main())
    }
    else {
      done()
    }
  },
})
