/**
 * Created by haozi on 4/16/2017.
 */


const spiderDownload = require('./spiderDownload')
const _ = require('lodash')


let processId = 0
let taskCount = 0
let endTaskCount = 0


process.on('message', message => {
    switch (message.type){
        case 'download':
            taskCount ++
            download(message.task)
            break;
        case 'processid':
            processId = message.id
            // console.log(`被分配的 Processid 是${processId}`)
            process.send({
                type: 'allottask',
                processId: processId,
                pid: process.pid
            })
            break;
        default:
            break;
    }
})
const download = task => {
    new spiderDownload(task).on('error', err => {
        task.retryCount++
        process.send({
            type: 'error',
            task: task,
            error: err
        })
        if(task.onerror == spiderDownload.handle.RETRY){
            if(task.retryCount < task.maxRetey){
                process.send({
                    type: 'retry',
                    task: task
                })
                download(task)
            }if(task.onerror == spiderDownload.handle.STOP || task.retryCount < task.maxRetey){
                process.send({
                    type: 'fail',
                    task: task
                })
            }
        }
    }).on('end', end => {
        console.log(`线程 ${processId} 完成了 ${task.id} 的任务`)
        endTaskCount ++
        process.send({
            type: 'downloadover',
            task: task
        })
        process.send({
            type: 'allottask',
            processId: processId,
            pid: process.pid
        })
    }).on('progress', state => process.send({
        type: 'progress',
        task:  _.assign(task, state)
    }))
}






