import { ValidationError } from "objection"
import { userGuard } from "./guards.js"
import { paths } from "./index.js"
import i18next from "i18next"

const taskOptions = async (app, task = undefined) => ({
    task,
    statuses: await app.models.status.query().select('id', 'name').orderBy('id'),
    users: await app.models.user.query().select('id', 'firstName', 'lastName').orderBy('id'),
    labels: [],
})

const tasksOptions = async (app) => {
    const statuses = (await app.models.status.query().select('id', 'name')).reduce((result, status) => { 
        result[status.id] = status
        return result
    }, {})
    const users = (await app.models.user.query().select('id', 'firstName', 'lastName')).reduce((result, user) => {
        result[user.id] = user
        return result
    }, {})
    const tasks = await app.models.task.query().select('id', 'name', 'statusId', 'creatorId', 'executorId', 'createDate').orderBy('id')
    for (const task of tasks) {
        task.status = statuses[task.statusId]
        task.creator = users[task.creatorId]
        task.executor = users[task.executorId]
    }
    return { tasks }
}

const getTask = async (app, id) => {
    const task = await app.models.task.query().findById(id)
    if (!task) return
    task.status = await app.models.status.query().findById(task.statusId)
    task.creator = await app.models.user.query().findById(task.creatorId)
    if (task.executorId) task.executor = await app.models.user.query().findById(task.executorId)
    return task
}

const fixTask = (req) => {
    if (typeof (req.body.data) !== 'object') req.body.data = {}
    req.body.data.creatorId = req.user.id
    req.body.data.statusId = parseInt(req.body.data.statusId)
    if (req.body.data.executorId) req.body.data.executorId = parseInt(req.body.data.executorId) 
    else delete req.body.data.executorId
}

export default (app) => {
    app.get(paths.createTask(), userGuard(), async (_, res) => {
        return res.render('createTask.pug', await taskOptions(app))
    })

    app.post(paths.tasks(), userGuard(), async (req, res) => {
        try {
            fixTask(req)
            const validTask = app.models.task.fromJson(req.body.data)
            await app.models.task.query().insert(validTask)
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
                req.flash('warning', i18next.t('layout.error'))
                return res.render('createTask.pug', await taskOptions(app, task))
            }
        }
    })

    app.get(paths.tasks(), userGuard(), async (_, res) => {
        return res.render('tasks.pug', await tasksOptions(app))
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
        const task = await app.models.task.query().findById(req.params.id)
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
                return res.redirect(paths.statuses())
            } catch (e) {
                const task = new app.models.task()
                task.$set(req.body.data)
                res.code(400)
                if (e instanceof ValidationError) {
                    req.flash('warning', Object.keys(e.data).map(key => `${i18next.t('layout.errorIn')} ${i18next.t(`tasks.${key}`)}`))
                    return res.render('editTask.pug', { task, errors: e.data })
                } else {
                    req.flash('warning', i18next.t('layout.error'))
                    return res.render('editTask.pug', { task })
                }
            }
        } else if (req.body._method === 'delete') {
            try {
                await app.models.task.query().deleteById(req.params.id)
                req.flash('info', i18next.t('tasks.deleteSuccess'))
                return res.redirect(paths.statuses())
            } catch {
                return res.callNotFound()
            }
        } else {
            req.flash('warning', i18next.t('layout.404'))
            return res.redirect(paths.tasks())
        }
    })
}