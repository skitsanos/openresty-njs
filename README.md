# openresty-njs
OpenResty with NJS bundled

The purpose of this project is to create a platform that uses [OpenResty](https://openresty.org/en/) as the core and ads nginx NJS as additional functionality, so both Lua and JavaScript programming languages can be used to develop HTTP route handlers.

### OpenResty
OpenResty® is a full-fledged web platform that integrates our enhanced version of the Nginx core, enhanced version of LuaJIT, many carefully written Lua libraries, lots of high quality 3rd-party Nginx modules, and most of their external dependencies. It is designed to help developers easily build scalable web applications, web services, and dynamic web gateways.

### NJS
[njs](https://nginx.org/en/docs/njs/) is a subset of the JavaScript language that allows extending nginx functionality. njs is created in compliance with ECMAScript 5.1 (strict mode) with some ECMAScript 6 and later extensions

### Building your OpenResty+NJS bundle

```shell
chmod +x ./build-from-sources.sh
sudo ./build-from-sources.sh
```

Get some patience, it takes some time ...

### Additional info

- [NGINX JavaScript examples](https://github.com/nginx/njs-examples/)
- [NJS Learning Materials](https://github.com/soulteary/njs-learning-materials)
