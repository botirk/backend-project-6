import usersRoute from './users.js'
import sessionRoute from './session.js'

const users = () => '/users/'

const signUp = () => users() + 'new/'

const session = () => '/session/'

const login = () => session() + 'new/'

const editUser = (id) => users() + 'edit/' + (id ?? ':id')

const editDeleteUser = (id) => users() + (id ?? ':id')

const main = () => '/'

export const paths = {
    users,
    signUp,
    main,
    session,
    login,
    editUser,
    editDeleteUser,
}

export default (app) => {
    app.get(main(), (_, res) => {
        res.render('main.pug')
    })

    usersRoute(app)
    sessionRoute(app)
}