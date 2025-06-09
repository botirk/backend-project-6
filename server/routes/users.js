import { paths } from "./index.js"

export default (app) => {
    app.get(paths.signUp(), (req, res) => {
        res.view('signUp.pug')
    })
}