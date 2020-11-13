<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stylesheet [
        <!ENTITY nbsp  "&#160;" >
        ]>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns="http://www.w3.org/1999/xhtml"
                xmlns:func="http://exslt.org/functions"
                xmlns:str="http://exslt.org/strings" version="1.0"
                exclude-result-prefixes="xhtml"
                extension-element-prefixes="func str">

    <xsl:output method="xml" version="1.0" encoding="UTF-8" doctype-public="-//W3C//DTD XHTML 1.1//EN"
                omit-xml-declaration="yes"
                doctype-system="http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd" indent="no"
                media-type="application/xhtml+xml"/>

    <xsl:strip-space elements="*"/>

    <xsl:template match="//page">
        <html>
            <head>
                <title>
                    <xsl:value-of select="@title"/>
                </title>
            </head>

            <body>
                <div>
                    <xsl:value-of select="$REQUEST_METHOD"/>&nbsp;
                    <xsl:value-of select="$REQUEST_URI"/>
                </div>
                <xsl:apply-templates select="./content"/>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>