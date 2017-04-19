#alphacoders 的爬虫

Node version >= 7.9.0  
npm install  
这个爬虫很简单 
我是想爬爬EroManga-Sensei的而已 = =   
例子 ->
```javascript
    const spider = require('./spider')
    const s = new spider('EroManga-Sensei', './download/EroManga-Sensei')
    s.pa().then(_ => {}).catch(e => console.log(e))
```

#参数
##spider
```javascript
    /**
     *  爬虫
     * @param keyword       关键字                 必须
     * @param outDir        输出目录               必须  目录必须已经存在
     * @param maxPage       最大爬取得页数          默认99999
     * @param maxProcess    最大下载进程数量        默认50
     */
    new spider(keywords, outDir, maxPage, maxProcess) 
    
    /**
    *   开始爬
    *   返回值是一个Promis
    *   @async 
    */
    spider.pa()

```
参数没有做校验 = =   
cli什么的暂时没有打算