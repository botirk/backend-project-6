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

export default (app) => {
    app.get(paths.createTask(), userGuard(), async (_, res) => {
        return res.render('createTask.pug', await taskOptions(app))
    })

    app.post(paths.tasks(), userGuard(), async (req, res) => {
        try {
            const validTask = app.models.task.fromJson({ ...req.body.data, creatorId: req.user.id, statusId: parseInt(req.body.data.statusId), executorId: parseInt(req.body.data.executorId) })
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
}