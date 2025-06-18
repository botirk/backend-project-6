import i18next from "i18next"
import { ValidationError } from "objection"
import { paths } from "./index.js"

export default (app) => {
    app.get(paths.signUp(), (_, res) => {
        res.render('signUp.pug')
    })

    app.post(paths.users(), async (req, res) => {        
        try {
            const validUser = app.models.user.fromJson(req.body.data)
            await app.models.user.query().insert(validUser)
            req.flash('success', i18next.t('signUp.success'))
            return res.redirect(paths.main())
        } catch (e) {
            const user = new app.models.user()
            user.$set(req.body.data)
            res.code(400)
            if (e instanceof ValidationError) {
                req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`signUp.${key}`)}`))
                return res.render('signUp.pug', { user, errors: e.data })
            } else {
                console.warn(e)
                req.flash('warning', i18next.t('layout.error'))
                return res.render('signUp.pug', { user })
            }
        }
    })

    app.get(paths.users(), async (_, res) => {
        const users = await app.models.user.query()
            .select('firstName', 'lastName', 'email', 'id', 'createDate')
            .orderBy('id')

        return res.render('users.pug', { users })
    })

    app.get(paths.editUser(':id'), async (req, res) => {
        if (req.params.id != req.user?.id) {
            req.flash('danger', i18next.t('layout.401'))
            return res.redirect(paths.main())
        }
        return res.render('editUser.pug', { user: req.user })
    })

    app.post(paths.editDeleteUser(':id'), async (req, res) => {
        if (req.params.id != req.user?.id) {
            req.flash('danger', i18next.t('layout.401'))
            return res.redirect(paths.users())
        }
        if (req.body._method  === 'delete') {
            await app.models.user.query().deleteById(req.user.id)
            await req.logOut()
            req.flash('info', i18next.t('editUser.deleted'))
            return res.redirect(paths.users())
        }
        try {
            const validUser = app.models.user.fromJson(req.body.data)
            await app.models.user.query().update(validUser).where('id', req.user.id)
            req.flash('success', i18next.t('editUser.success'))
            return res.redirect(paths.users())
        } catch(e) {
            const user = new app.models.user()
            user.$set(req.body.data)
            res.code(400)
            if (e instanceof ValidationError) {
                req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`signUp.${key}`)}`))
                return res.render('editUser.pug', { user: { ...req.user, ...user }, errors: e.data })
            } else {
                req.flash('warning', i18next.t('layout.error'))
                return res.render('editUser.pug', { user: { ...req.user, ...user } })
            }
        }
    })
}