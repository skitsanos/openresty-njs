/**
 * http://nginx.org/en/docs/http/ngx_http_js_module.html
 * http://nginx.org/en/docs/njs/reference.html
 */


function hello(req)
{
    req.headersOut['content-type'] = 'application/json';

    req.return(200, JSON.stringify({
        env: process.env,
        argv: process.argv,
        vars: req.variables,
        req,
        njs
    }));
}

export default {hello};