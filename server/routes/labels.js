import i18next from 'i18next'
import { paths } from './index.js'
import { userGuard } from './guards.js'
import { ForeignKeyViolationError, ValidationError } from 'objection'

export default (app) => {
  app.get(paths.createLabel(), userGuard(), async (req, res) => {
    return res.render('createLabel.pug')
  })

  app.post(paths.labels(), userGuard(), async (req, res) => {
    try {
      const validLabel = app.models.label.fromJson(req.body.data)
      await app.models.label.query().insert(validLabel)
      req.flash('success', i18next.t('labels.createSuccess'))
      return res.redirect(paths.labels())
    }
    catch (e) {
      const label = new app.models.label()
      label.$set(req.body.data)
      res.code(400)
      if (e instanceof ValidationError) {
        req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`labels.${key}`)}`))
        return res.render('createLabel.pug', { label, errors: e.data })
      }
      else {
        console.warn(e)
        req.flash('warning', i18next.t('layout.error'))
        return res.render('createLabel.pug', { label })
      }
    }
  })

  app.get(paths.labels(), userGuard(), async (_, res) => {
    const labels = await app.models.label.query()
      .select('id', 'name', 'createDate')
      .orderBy('id')

    return res.render('labels.pug', { labels })
  })

  app.get(paths.editLabel(':id'), userGuard(), async (req, res) => {
    const label = await app.models.label.query().findById(req.params.id)
    if (!label) {
      req.flash('warning', i18next.t('layout.404'))
      return res.redirect(paths.labels())
    }
    return res.render('editLabel.pug', { label })
  })

  app.post(paths.editDeleteLabel(':id'), userGuard(), async (req, res) => {
    if (req.body._method === 'patch') {
      try {
        const validLabel = app.models.label.fromJson(req.body.data)
        await app.models.label.query().update(validLabel).where('id', req.params.id)
        req.flash('success', i18next.t('labels.editSuccess'))
        return res.redirect(paths.labels())
      }
      catch (e) {
        const label = new app.models.label()
        label.$set(req.body.data)
        res.code(400)
        if (e instanceof ValidationError) {
          req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`labels.${key}`)}`))
          return res.render('editLabel.pug', { label, errors: e.data })
        }
        else {
          console.warn(e)
          req.flash('warning', i18next.t('layout.error'))
          return res.render('editLabel.pug', { label })
        }
      }
    }
    else if (req.body._method === 'delete') {
      try {
        await app.models.label.query().deleteById(req.params.id)
        req.flash('info', i18next.t('labels.deleteSuccess'))
        return res.redirect(paths.labels())
      }
      catch (e) {
        console.warn(e)
        if (e instanceof ForeignKeyViolationError) {
          req.flash('warning', i18next.t('tasks.deleteLinkedResource'))
          return res.redirect(paths.labels())
        }
        else {
          return res.callNotFound()
        }
      }
    }
    else {
      return res.callNotFound()
    }
  })
}
