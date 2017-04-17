/**
 * Created by haozi on 4/16/2017.
 */



const spider = require('./index')


const s = new spider('EroManga-Sensei', './download/EroManga-Sensei')
s.pa().then(_ => {}).catch(e => console.log(e))
