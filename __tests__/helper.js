import { paths } from "../server/routes"

export const login = async (app, email = 'testEmail') => {
    await app.inject({ 
        method: 'POST', url: paths.users(), 
        payload: { data: { firstName: 'testUser', lastName: 'testUser', email, password: 'testPassword' }}  
    })

    const user = await app.inject({ 
        method: 'POST', url: paths.session(), 
        payload: { data: { email, password: 'testPassword' }}  
    })

    const cookie = user.cookies.find(cookie => cookie.name === 'session').value

    return (options) => app.inject({ ...options, cookies: { ...(options.cookies ?? {}), session: cookie }})
}