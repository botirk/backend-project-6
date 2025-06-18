import i18next from 'i18next'
import { paths } from './index.js'
import { userGuard } from './guards.js'
import { ValidationError } from 'objection'

export default (app) => {
  app.get(paths.createStatus(), userGuard(), async (req, res) => {
    return res.render('createStatus.pug')
  })

  app.post(paths.statuses(), userGuard(), async (req, res) => {
    try {
      const validStatus = app.models.status.fromJson(req.body.data)
      await app.models.status.query().insert(validStatus)
      req.flash('success', i18next.t('statuses.createSuccess'))
      return res.redirect(paths.statuses())
    }
    catch (e) {
      const status = new app.models.status()
      status.$set(req.body.data)
      res.code(400)
      if (e instanceof ValidationError) {
        req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`statuses.${key}`)}`))
        return res.render('createStatus.pug', { status, errors: e.data })
      }
      else {
        console.warn(e)
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

  app.post(paths.editDeleteStatus(':id'), userGuard(), async (req, res) => {
    if (req.body._method === 'patch') {
      try {
        const validStatus = app.models.status.fromJson(req.body.data)
        await app.models.status.query().update(validStatus).where('id', req.params.id)
        req.flash('success', i18next.t('statuses.editSuccess'))
        return res.redirect(paths.statuses())
      }
      catch (e) {
        const status = new app.models.status()
        status.$set(req.body.data)
        res.code(400)
        if (e instanceof ValidationError) {
          req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`statuses.${key}`)}`))
          return res.render('editStatus.pug', { status, errors: e.data })
        }
        else {
          console.warn(e)
          req.flash('warning', i18next.t('layout.error'))
          return res.render('editStatus.pug', { status })
        }
      }
    }
    else if (req.body._method === 'delete') {
      try {
        await app.models.status.query().deleteById(req.params.id)
        req.flash('info', i18next.t('statuses.deleteSuccess'))
        return res.redirect(paths.statuses())
      }
      catch {
        return res.callNotFound()
      }
    }
    else {
      return res.callNotFound()
    }
  })
}
