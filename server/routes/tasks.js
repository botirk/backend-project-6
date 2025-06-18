import { ValidationError } from "objection"
import { userGuard } from "./guards.js"
import { paths } from "./index.js"
import i18next from "i18next"

const taskOptions = async (app, task = undefined) => {
    const result = {
        task,
        statuses: await app.models.status.query().orderBy('id'),
        users: await app.models.user.query().select('id', 'firstName', 'lastName').orderBy('id'),
        labels: await app.models.label.query().orderBy('id'),
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

const getTasks = async (app) => await app.models.task.query().orderBy('id').withGraphFetched({ status: true, creator: true, executor: true, labels: true })

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
        } catch (e) {
            const task = new app.models.task()
            task.$set(req.body.data)
            res.code(400)
            if (e instanceof ValidationError) {
                req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`tasks.${key}`)}`))
                return res.render('createTask.pug', await taskOptions(app, task))
            } else {
                console.warn(e)
                req.flash('warning', i18next.t('layout.error'))
                return res.render('createTask.pug', await taskOptions(app, task))
            }
        }
    })

    app.get(paths.tasks(), userGuard(), async (_, res) => {
        return res.render('tasks.pug', { tasks: await getTasks(app) })
    })

    app.get(paths.showEditDeleteTask(':id'), userGuard(), async (req, res) => {
        const task = await getTask(app, req.params.id)
        if (!task) {
            req.flash('warning', i18next.t('layout.404'))
            return res.redirect(paths.tasks())
        }
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
        if (req.body._method === 'patch') {
            try {
                fixTask(req)
                const validTask = app.models.task.fromJson(req.body.data)
                await app.models.task.query().update(validTask).where('id', req.params.id)
                req.flash('success', i18next.t('tasks.editSuccess'))
                return res.redirect(paths.tasks())
            } catch (e) {
                const task = new app.models.task()
                task.$set(req.body.data)
                res.code(400)
                if (e instanceof ValidationError) {
                    req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`tasks.${key}`)}`))
                    return res.render('editTask.pug', await taskOptions(app, task))
                } else {
                    console.warn(e)
                    req.flash('warning', i18next.t('layout.error'))
                    return res.render('editTask.pug', await taskOptions(app, task))
                }
            }
        } else if (req.body._method === 'delete') {
            try {
                await app.models.task.query().deleteById(req.params.id)
                req.flash('info', i18next.t('tasks.deleteSuccess'))
                return res.redirect(paths.tasks())
            } catch {
                return res.callNotFound()
            }
        } else {
            req.flash('warning', i18next.t('layout.404'))
            return res.redirect(paths.tasks())
        }
    })
}