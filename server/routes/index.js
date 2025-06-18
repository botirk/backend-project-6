import usersRoute from './users.js'
import sessionRoute from './session.js'
import statusesRoute from './statuses.js'
import tasksRoute from './tasks.js'
import labelsRoute from './labels.js'

const users = () => '/users/'

const signUp = () => users() + 'new/'

const session = () => '/session/'

const login = () => session() + 'new/'

const editUser = id => users() + 'edit/' + (id ?? ':id')

const editDeleteUser = id => users() + (id ?? ':id')

const statuses = () => '/statuses/'

const createStatus = () => statuses() + 'new'

const editDeleteStatus = id => statuses() + (id ?? ':id')

const editStatus = id => statuses() + (id ?? ':id') + '/edit'

const main = () => '/'

const tasks = () => '/tasks/'

const createTask = () => tasks() + 'new'

const editTask = id => tasks() + (id ?? ':id') + '/edit'

const showEditDeleteTask = id => tasks() + (id ?? ':id')

const labels = () => '/labels/'

const createLabel = () => labels() + 'new'

const editDeleteLabel = id => labels() + (id ?? ':id')

const editLabel = id => labels() + (id ?? ':id') + '/edit'

export const paths = {
  users,
  signUp,
  main,
  session,
  login,
  editUser,
  editDeleteUser,
  statuses,
  createStatus,
  editDeleteStatus,
  editStatus,
  tasks,
  createTask,
  editTask,
  showEditDeleteTask,
  labels,
  createLabel,
  editDeleteLabel,
  editLabel,
}

export default (app) => {
  app.get(main(), (_, res) => res.render('main.pug'))

  usersRoute(app)
  sessionRoute(app)
  statusesRoute(app)
  tasksRoute(app)
  labelsRoute(app)
}
