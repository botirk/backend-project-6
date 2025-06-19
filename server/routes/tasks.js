import { ForeignKeyViolationError, ValidationError } from 'objection'
import { userGuard } from './guards.js'
import { paths } from './index.js'
import i18next from 'i18next'

const taskErrors = e => Object.keys(e.data).reduce((object, key) => {
  object[key] = `${i18next.t('layout.errorIn')} ${i18next.t(`tasks.${key}`)}`
  return object
}, {})

const taskOptions = async (app, task = undefined, errors = undefined) => {
  const result = {
    task,
    statuses: await app.models.status.query().orderBy('id'),
    users: await app.models.user.query().select('id', 'firstName', 'lastName').orderBy('id'),
    labels: await app.models.label.query().orderBy('id'),
    errors,
  }

  if (task?.labels) {
    for (const label of result.labels) {
      if (task.labels.some(taskLabel => taskLabel.id == label.id)) {
        label.selected = true
      }
    }
  }
  return result
}

const tasksOptions = async (app, req) => {
  let tasks = app.models.task.query().orderBy('id').withGraphFetched({ status: true, creator: true, executor: true, labels: true })

  if (req.query.status) {
    const statusId = parseInt(req.query.status)
    if (!isNaN(statusId)) {
      tasks = tasks.where('statusId', statusId)
    }
  }

  if (req.query.executor) {
    const executorId = parseInt(req.query.executor)
    if (!isNaN(executorId)) {
      tasks = tasks.where('executorId', executorId)
    }
  }

  if (req.query.label) {
    const labelId = parseInt(req.query.label)
    if (!isNaN(labelId)) {
      const taskIds = (await app.models.taskLabel.query().where('labelId', labelId)).map(taskLabel => taskLabel.taskId)
      tasks = tasks.whereIn('id', taskIds)
    }
  }

  if (req.query.isCreatorUser) {
    tasks = tasks.where('creatorId', req.user.id)
  }

  return {
    tasks: await tasks,
    statuses: await app.models.status.query().orderBy('id'),
    users: await app.models.user.query().select('id', 'firstName', 'lastName').orderBy('id'),
    labels: await app.models.label.query().orderBy('id'),
    query: {
      status: req.query.status,
      executor: req.query.executor,
      label: req.query.label,
      isCreatorUser: req.query.isCreatorUser,
    },
  }
}

const getTask = async (app, id) => await app.models.task.query().findById(id).withGraphFetched({ status: true, creator: true, executor: true, labels: true })

const fixTask = (req) => {
  if (typeof (req.body.data) !== 'object') req.body.data = {}
  req.body.data.creatorId = req.user.id
  req.body.data.statusId = parseInt(req.body.data.statusId)
  if (req.body.data.executorId) req.body.data.executorId = parseInt(req.body.data.executorId)
  else delete req.body.data.executorId
  if (!req.body.data.labels) req.body.data.labels = []
  else if (typeof (req.body.data.labels) === 'string') req.body.data.labels = req.body.data.labels.split(',').map(label => parseInt(label.trim()))
}

export default (app) => {
  app.get(paths.createTask(), userGuard(), async (_, res) => {
    return res.render('createTask.pug', await taskOptions(app))
  })

  app.post(paths.tasks(), userGuard(), async (req, res) => {
    try {
      fixTask(req)
      const validTask = app.models.task.fromJson(req.body.data)
      await app.models.task.transaction(async (trx) => {
        const task = await app.models.task.query(trx).insert(validTask)
        for (const label of req.body.data.labels) await task.$relatedQuery('labels', trx).relate(label)
      })
      req.flash('success', i18next.t('tasks.createSuccess'))
      return res.redirect(paths.tasks())
    }
    catch (e) {
      const task = new app.models.task()
      task.$set(req.body.data)
      res.code(400)
      req.flash('warning', i18next.t('tasks.createFail'))
      if (e instanceof ValidationError) {
        return res.render('createTask.pug', await taskOptions(app, task, taskErrors(e)))
      }
      else {
        console.warn(e)
        return res.render('createTask.pug', await taskOptions(app, task))
      }
    }
  })

  app.get(paths.tasks(), userGuard(), async (req, res) => {
    return res.render('tasks.pug', await tasksOptions(app, req))
  })

  app.get(paths.showEditDeleteTask(':id'), userGuard(), async (req, res) => {
    const task = await getTask(app, req.params.id)
    if (!task) return res.callNotFound()
    return res.render('task.pug', { task })
  })

  app.get(paths.editTask(':id'), userGuard(), async (req, res) => {
    const task = await getTask(app, req.params.id)
    if (!task) {
      req.flash('warning', i18next.t('layout.404'))
      return res.redirect(paths.tasks())
    }
    return res.render('editTask.pug', await taskOptions(app, task))
  })

  app.post(paths.showEditDeleteTask(':id'), userGuard(), async (req, res) => {
    if (!(await app.models.task.query().findById(req.params.id))) {
      return res.callNotFound()
    }
    else if (req.body._method === 'patch') {
      fixTask(req)
      try {
        const validTask = app.models.task.fromJson(req.body.data)
        await app.models.task.transaction(async (trx) => {
          await app.models.taskLabel.query(trx).delete().where('taskId', req.params.id)
          await app.models.task.query(trx).findById(req.params.id).patch(validTask)
          for (const label of req.body.data.labels) await app.models.task.relatedQuery('labels', trx).for(req.params.id).relate(label)
        })
        req.flash('success', i18next.t('tasks.editSuccess'))
        return res.redirect(paths.tasks())
      }
      catch (e) {
        const task = new app.models.task()
        task.$set(req.body.data)
        res.code(400)
        req.flash('warning', i18next.t('tasks.editFail'))
        if (e instanceof ValidationError) {
          return res.render('editTask.pug', await taskOptions(app, task, taskErrors(e)))
        }
        else {
          console.warn(e)
          return res.render('editTask.pug', await taskOptions(app, task))
        }
      }
    }
    else if (req.body._method === 'delete') {
      try {
        await app.models.task.transaction(async (trx) => {
          await app.models.taskLabel.query(trx).delete().where('taskId', req.params.id)
          await app.models.task.query(trx).deleteById(req.params.id)
        })
        req.flash('info', i18next.t('tasks.deleteSuccess'))
        return res.redirect(paths.tasks())
      }
      catch (e) {
        console.warn(e)
        if (e instanceof ForeignKeyViolationError) {
          req.flash('warning', i18next.t('tasks.deleteLinkedResource'))
          return res.redirect(paths.tasks())
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
