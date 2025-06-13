import i18next from "i18next"
import { paths } from "./index.js"

export default (app) => {
    app.get(paths.login(), (_, res) => {
        res.render('login.pug')
    })

    app.post(
        paths.session(),
        { preValidation: app.passport.authenticate('form') },
        async (req, res) => {
            if (req.body._method === 'delete') {
                await req.logOut()
                res.flash('info', i18next.t('layout.logout'))
                return res.redirect(paths.main())
            }
            if (!req.user) {
                req.flash('warning', i18next.t('login.error'))
                return res.code(401).render('login', { user: req.body.data })
            }
            await req.logIn(req.user)
            req.flash('success', i18next.t('login.success'))
            return res.redirect(paths.main())
        }
    )
}