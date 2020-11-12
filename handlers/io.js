var fs = require('fs');

var response = {
    error: function (data)
    {
        return JSON.stringify({error: data});
    },

    result: function (data)
    {
        return JSON.stringify({result: data});
    }
};

function fileBrowser(req)
{
    req.headersOut['content-type'] = 'application/json';

    switch (req.method.toUpperCase())
    {

        default:
            break;
    }

    var arr = [];

    var dir = fs.readdirSync(process.env.PWD + '/data', {withFileTypes: true});

    for (var ndx in dir)
    {
        var item = dir[ndx];
        if (item.isFile() || item.isDirectory())
        {
            req.log(item.name);
            arr.push({
                name: item.name,
                type: item.isDirectory() ? 'directory' : 'file'
            });
        }
    }

    req.return(200, response.result(arr));
}

export default {fileBrowser};