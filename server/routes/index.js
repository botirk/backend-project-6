import usersRoute from './users.js'
import sessionRoute from './session.js'
import statusesRoute from './statuses.js'

const users = () => '/users/'

const signUp = () => users() + 'new/'

const session = () => '/session/'

const login = () => session() + 'new/'

const editUser = (id) => users() + 'edit/' + (id ?? ':id')

const editDeleteUser = (id) => users() + (id ?? ':id')

const statuses = () => '/statuses/'

const createStatus = () => statuses() + 'new'

const editDeleteStatus = (id) => statuses() + (id ?? ':id')

const editStatus = (id) => statuses() + (id ?? ':id') + '/edit'

const main = () => '/'

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
}

export default (app) => {
    app.get(main(), (_, res) => {
        res.render('main.pug')
    })

    
    usersRoute(app)
    sessionRoute(app)
    statusesRoute(app)
}