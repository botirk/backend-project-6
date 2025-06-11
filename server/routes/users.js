import i18next from "i18next"
import { paths } from "./index.js"

export default (app) => {
    app.get(paths.signUp(), (_, res) => {
        res.render('signUp.pug')
    })

    app.post(paths.users(), async (req, res) => {        
        try {
            const validUser = await app.models.user.fromJson(req.body.data)
            await app.models.user.query().insert(validUser)
            req.flash('success', i18next.t('signUp.success'))
            res.redirect(paths.main())
        } catch ({ data: errors }) {
            const user = new app.models.user()
            user.$set(req.body.data)
            res.render('signUp.pug', { user, errors })
        }
    })

    app.get(paths.users(), (req, res) => {
        res.render('users.pug')
    })
}