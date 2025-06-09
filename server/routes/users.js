import { signUp } from "./index.js"

export default (app) => {
    app.get(signUp(), (req, res) => {
        res.view('register.pug')
    })
}