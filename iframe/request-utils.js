const commonUrl = 'http://1.14.169.21:5099'
localStorage.setItem("access_token","Bearer HPNyhy4x2tH5fP9L1iBCDNuaOwwKR5IJxBDqfH6Jl0")

function parseJSON(response){
    return response.json()
}

function checkStatus(response){
    if(response.status >= 200 && response.status < 500){
        return response
    }
    const error = new Error(response.statusText)
    error.response = response
    throw error
}

export default  function request(options = {}){
    const Authorization = localStorage.getItem('access_token')
    const {data,url} = options
    options = {...options}
    options.mode = 'cors'
    delete options.url
    if(data){
        delete options.data
        options.body = JSON.stringify(data)
    }
    options.headers={
        'Authorization':Authorization,
    }
    if (options.method === "post"){
        options.headers['Content-Type'] = 'application/json;charset=UTF-8'
    }
    return fetch(commonUrl+url,options,{credentials: 'include'})
        .then(checkStatus)
        .then(parseJSON)
        .catch(err=>({err}))
}
