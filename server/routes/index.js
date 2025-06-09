import usersRoute from './users.js'

const users = () => '/users/'

const signUp = () => users() + 'new/'

const main = () => '/'

export const paths = {
    users,
    signUp,
    main,
}

export default (app) => {
    app.get(main(), (_, res) => {
        res.view('main.pug')
    })

    usersRoute(app)
}