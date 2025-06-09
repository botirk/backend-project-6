import usersRoute from './users.js'

export const users = () => '/users/'

export const signUp = () => users() + 'new/'

export const main = () => '/'

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