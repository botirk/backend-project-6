import i18next from "i18next"
import { paths } from "./index.js"
import fastifyPassport from '@fastify/passport'

export default (app) => {
    app.get(paths.login(), (_, res) => {
        res.render('login.pug')
    })

    fastifyPassport.strategy()

    app.post(paths.session(), async (req, res) => {
        if (req.body._method === 'delete') {
            await req.logOut()
            res.flash('info', i18next.t('layout.logout'))
            return res.redirect(paths.main())
        } else if (req.user) {
            return res.redirect(paths.main())
        }

        return await new Promise(async (resolve) => {
            app.passport.authenticate('form', async (_1, _2, _3, user) => {
                if (!user) {
                    req.flash('warning', i18next.t('login.error'))
                    resolve(res.code(401).render('login', { user: req.body.data }))
                } else {
                    await req.logIn(user)
                    req.flash('success', i18next.t('login.success'))
                    resolve(res.redirect(paths.main()))
                }
            })(req, res)
        })
    })
}