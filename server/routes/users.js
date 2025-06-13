import i18next from "i18next"
import { ValidationError } from "objection"
import { paths } from "./index.js"
import { encrypt } from "../auth.js"

export default (app) => {
    app.get(paths.signUp(), (_, res) => {
        res.render('signUp.pug')
    })

    app.post(paths.users(), async (req, res) => {        
        try {
            const validUser = await app.models.user.fromJson(req.body.data)
            validUser.password = encrypt(validUser.password)
            await app.models.user.query().insert(validUser)
            req.flash('success', i18next.t('signUp.success'))
            return res.redirect(paths.main())
        } catch (e) {
            const user = new app.models.user()
            user.$set(req.body.data)
            req.log.info(`failed to sign-up user with email '${user.email}'`)
            res.code(400)
            if (e instanceof ValidationError) {
                req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('users.errorIn')} ${i18next.t(`signUp.${key}`)}`))
                return res.render('signUp.pug', { user, errors: e.data })
            } else {
                req.flash('warning', i18next.t('users.error'))
                return res.render('signUp.pug', { user })
            }
        }
    })

    app.get(paths.users(), async (_, res) => {
        const users = await app.models.user.query()
            .select('firstName', 'lastName', 'email', 'id', 'createDate')
            .orderBy('id');

        return res.render('users.pug', { users })
    })
}