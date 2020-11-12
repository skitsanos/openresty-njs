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

var requestContentType = function (data)
{
    return data.split(';')[0].toLowerCase();
};

function MultiPart_parse(body, contentType)
{
    // Examples for content types:
    //      multipart/form-data; boundary="----7dd322351017c"; ...
    //      multipart/form-data; boundary=----7dd322351017c; ...
    var m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

    if (!m)
    {
        throw new Error('Bad content-type header, no multipart boundary');
    }

    var s, fieldName;
    var boundary = m[1] || m[2];

    function Header_parse(header)
    {
        var headerFields = {};
        var matchResult = header.match(/^.*name="([^"]*)"$/);
        if (matchResult)
        {
            headerFields.name = matchResult[1];
        }
        return headerFields;
    }

    function rawStringToBuffer(str)
    {
        var idx, len = str.length,
            arr = new Array(len);
        for (idx = 0; idx < len; ++idx)
        {
            arr[idx] = str.charCodeAt(idx) & 0xFF;
        }
        return new Uint8Array(arr).buffer;
    }

    // \r\n is part of the boundary.
    boundary = '\r\n--' + boundary;

    var isRaw = typeof (body) !== 'string';

    if (isRaw)
    {
        var view = new Uint8Array(body);
        s = String.fromCharCode.apply(null, view);
    }
    else
    {
        s = body;
    }

    // Prepend what has been stripped by the body parsing mechanism.
    s = '\r\n' + s;

    var parts = s.split(new RegExp(boundary)),
        partsByName = {};

    // First part is a preamble, last part is closing '--'
    for (var i = 1; i < parts.length - 1; i++)
    {
        var subparts = parts[i].split('\r\n\r\n');
        var headers = subparts[0].split('\r\n');
        for (var j = 1; j < headers.length; j++)
        {
            var headerFields = Header_parse(headers[j]);
            if (headerFields.name)
            {
                fieldName = headerFields.name;
            }
        }

        partsByName[fieldName] = isRaw ? rawStringToBuffer(subparts[1]) : subparts[1];
    }

    return partsByName;
}

function Boundary_parse(body)
{
    var bndry = body.split('Content-Disposition: form-data;')[0];
    return bndry.trim().slice(2);
}

function fsReadable(path)
{
    try
    {
        fs.accessSync(path, fs.constants.R_OK);
        return true;
    } catch (e)
    {
        return false;
    }
}

function fileBrowser(req)
{
    req.headersOut['content-type'] = 'application/json';

    var validContentTypes = [
        'application/json',
        'multipart/form-data'
    ];

    var pathRequested = '/' + req.uri.split('/').slice(2).join('/');
    var fullPath = process.env.PWD + '/data' + pathRequested;

    if (!fsReadable(fullPath))
    {
        req.return(404, response.error({message: 'Not found'}));
        return;
    }

    var dir = null;

    var isFileRequested = false;

    try
    {
        dir = fs.readdirSync(fullPath, {withFileTypes: true});
    } catch (e)
    {
        //ENOTDIR = not a dir
        //ENOENT = not found
        if (e.code === 'ENOENT')
        {
            req.return(404, response.error({
                path: pathRequested,
                message: 'Not found'
            }));
        }
        else if (e.code === 'ENOTDIR')
        {
            isFileRequested = true;
        }
    }

    switch (req.method.toUpperCase())
    {
        case 'GET':
            if (!isFileRequested)
            {
                //browse folder
                var arr = [];

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

                req.return(200, response.result({
                    path: pathRequested,
                    data: arr
                }));
            }
            else
            {
                req.headersOut['content-type'] = 'application/octet-stream';

                //[method 1]
                //req.return(200, fs.readFileSync(process.env.PWD + '/data' + pathRequested));

                //[method 2]
                req.internalRedirect('/files_get' + pathRequested);
            }
            return;

        case 'POST':
            //check the content-type, only multipart/form-data and application/json must be allowed
            if (isFileRequested)
            {
                req.return(409, response.error({message: 'Conflict'}));
                return;
            }

            if (req.headersIn['Content-Length'] === 0)
            {
                req.return(409, response.error({message: 'Payload is missing'}));
                return;
            }

            if (!Boolean(req.headersIn['Content-Type']))
            {
                req.return(409, response.error({message: 'Content-Type is missing'}));
                return;
            }

            var contentType = requestContentType(req.headersIn['Content-Type']);

            if (!validContentTypes.includes(contentType))
            {
                req.return(409, response.error({message: 'Incorrect Content-Type'}));
                return;
            }

            //requestBody
            if (contentType === 'multipart/form-data')
            {
                var parsedContent = MultiPart_parse(req.requestBody, req.headersIn['Content-Type']);

                //store files to requested path
                for (var file in parsedContent)
                {
                    var pathToStore = fullPath + '/' + file;
                    fs.writeFileSync(pathToStore, parsedContent[file]);
                }

                req.return(200, response.result({
                    path: pathRequested,
                    files: Object.keys(parsedContent)
                }));
            }
            else
            {
                //parse JSON payload
                var doc = {};
                try
                {
                    doc = JSON.parse(req.requestBody);
                    if (Object.keys(doc).includes('name'))
                    {
                        fs.mkdirSync(process.env.PWD + '/data' + pathRequested + '/' + doc.name);
                        req.return(200, response.result(pathRequested + '/' + doc.name));
                        return;
                    }

                    req.return(409, response.error({message: 'Failed to create. Missing name'}));
                } catch (e)
                {
                    req.return(409, response.error({message: e.message}));
                }
            }
            return;

        case 'DELETE':
            if (!isFileRequested)
            {
                //deleting folder
                fs.rmdirSync(fullPath);
            }
            else
            {
                //deleting file
                req.return(500, response.error({message: 'NJS has no support for file removal at this moment'}));
            }

            req.return(200, response.result({pathRequested, isFileRequested}));
            return;

        default:
            req.return(405, response.error({message: 'Not supported'}));
            return;
    }
}

export default {fileBrowser};