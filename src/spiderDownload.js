/**
 * Created by haozi on 4/16/2017.
 */

const events = require('events')
const request = require('request')
const progress = require('request-progress')
const fs = require('fs')


/**
 * 蜘蛛下载模块
 * @extends Events.EventEmitter
 * @class
 */
class spiderDownload extends events.EventEmitter {
    constructor(task) {
        super()
        this.getImage(task.url, task.outDir)
    }

    getImage (imageUrl, outDir) {
        try{
            progress(request(imageUrl)).on('progress', state => {
                this.emit('progress', state)
            }).on('error', err => {
                this.emit('error', err)
            }).on('end', () => {
                this.emit('end', {
                    outFille: `${outDir}/${imageUrl.split('/').pop()}`
                })
            }).pipe(fs.createWriteStream(`${outDir}/${imageUrl.split('/').pop()}`))
        }catch (e){
            throw e
        }
    }

    /**
     *  失败策略
     * @type {{RETRY: *, STOP: *}}
     */
}

spiderDownload.handle = {
    RETRY: 0,
    STOP: 1
}




module.exports = spiderDownload