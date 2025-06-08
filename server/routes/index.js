
export default (app) => {
    app.get('/', (_, res) => {
        res.view('main.pug')
    })
}