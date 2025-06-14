import i18next from "i18next"
import { paths } from "./index.js"
import { userGuard } from "./guards.js"

export default (app) => {
    app.get(paths.createStatus(), userGuard(), async (req, res) => {
        return res.render('createStatus.pug')
    })

    app.post(paths.statuses(), userGuard(), async (req, res) => {
        try {
            const validStatus = await app.models.status.fromJson(req.body.data)
            await app.models.status.query().insert(validStatus)
            req.flash('success', i18next.t('statuses.createSuccess'))
            return res.redirect(paths.statuses())
        } catch (e) {
            const status = new app.models.status()
            status.$set(req.body.data)
            res.code(400)
            if (e instanceof ValidationError) {
                req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`status.${key}`)}`))
                return res.render('createStatus.pug', { status, errors: e.data })
            } else {
                req.flash('warning', i18next.t('layout.error'))
                return res.render('createStatus.pug', { status })
            }
        }
    })

    app.get(paths.statuses(), userGuard(), async (_, res) => {
        const statuses = await app.models.status.query()
            .select('id', 'name', 'createDate')
            .orderBy('id')

        return res.render('statuses.pug', { statuses })
    })

    app.get(paths.editStatus(':id'), userGuard(), async (req, res) => {
        const status = await app.models.status.query().findById(req.params.id)

        if (!status) return res.code(400)
        return res.render('editStatus.pug', { status })
    })
}