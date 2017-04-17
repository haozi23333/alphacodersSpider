/**
 * Created by haozi on 4/17/2017.
 */

const events = require('events')
const fork = require('child_process').fork
const _ = require('lodash')
const fs = require('fs')
const spiderDownload = require('./spiderDownload')


class spiderManager extends events.EventEmitter{
    constructor (urlList, outDir, maxProcess) {
        super()
        this.processList = []
        this.maxProcess = maxProcess
        this.outDir = outDir
        this.urlList = urlList
        this.taskList = []
        this.taskIndex = 0
        this.failList = []
        this.maxRetry = 30
        this.okList = []
        this.createProcess()
    }

    awit () {
        this.processList.map((v, i) => v.send({
            type: 'processid',
            id: i
        }))
        return new Promise((s, j) => {
            process.nextTick(() => {
                if(this.okList.length == this.urlList){
                    s(this.okList)
                }
            })
        })
    }

    /**
     * 创建指定数量的线程
     */
    createProcess (){
        this.maxProcess = this.maxProcess > this.urlList.length ? this.urlList.length : this.maxProcess
        let processId = 0
        this.processList = Array(this.maxProcess).fill(1).map(() => {
            const newProcess = fork(__dirname +'/downProcess.js')
            newProcess.on('message', this.onmessage(this))
            newProcess.on('error',  (err) => {
                console.log(err)
            })
            return newProcess
        })

    }

    /**
     * 分配task
     */
    allotTask (processId){
        if( this.taskIndex == this.urlList.length){
            return null
        }
        const task = {}
        task.id = this.taskIndex ++
        task.url = this.urlList[task.id]
        task.onerror = spiderDownload.handle.RETRY
        task.retryCount = 0
        task.maxRetey = this.maxRetry
        task.percent = 0
        task.speed = 0
        task.message = ""
        task.processId = processId
        task.outDir = this.outDir
        this.taskList.push(task)
        return task
    }

    /**
     * 删除指定的task
     * @param task
     */
    removeTask (task){
        for(let i = 0; i < this.taskList.length;i ++){
            if(this.taskList[i].url == task.url){
                this.taskList(i, 1)
                return
            }
        }
    }

    onmessage(context){
        return (message) => {
            switch (message.type){
                case 'error':
                    context.onerror(message)
                    break
                case 'retey':
                    context.onretry(message.task)
                    break
                case 'fail':
                    context.onfail(message.task)
                    break
                case 'close':
                    context.onclose(message)
                    break
                case 'progress':
                    context.onprogress(message.task)
                    break
                case 'allottask':
                    context.onallottask(message.processId, message.pid)
                    break
                case 'downloadover':
                    context.ondownloadOver(message.task)
                    break
                default:
                    break
            }
        }
    }
    onerror (task) {
        console.log(`task -> ${task.id} 发生错误 正在执行一定的错误策略`)
        // this.emit('error', err.error)
    }
    onend (task) {
        this.emit('end', "233")
    }

    ondownloadOver (task) {
        this.okList.push(task)
        this.emit('progress', this.okList.length / this.urlList.length)
        // console.log(`task ${task.id} 已经下载完成 ${task.retryCount}次重试  massage -> ${task.message}`)
    }

    onretry (task){
        console.log(`task ${task.id} 正在进行 ${task.retryCount}重试  massage -> ${task.message}`)
    }
    onfail (task){
        console.log(`task ${task.id} 运行失败  massage -> ${task.message}`)
    }
    onprogress (task){
        this.findTaskById(task.id, task)
        // this.emit('progress', task)
    }
    onclose (processQAQ){
        console.log(`process ${processQAQ.pid} 正在关闭 这个线程已经处理了 ${processQAQ.endTaskCount} 个任务 总共分配了 ${processQAQ.taskCount}`)
    }
    onallottask(processId, pid){
        const task = this.allotTask(processId)
        if(task == null){
            console.log(`线程 ${processId} 完成使命`)
            this.processList[processId].kill()
        }else {
            this.processList[processId].send({
                type: 'download',
                task: task
            })
        }
    }

    findTaskById (id, newtask){
        for(let i = 0; i < this.taskList.length;i ++){
            if(this.taskList[i].id == id){
                if(newtask){
                    this.taskList[i] == newtask
                    return newtask
                }else {
                    return this.taskList[i]
                }
            }
        }
    }

}
module.exports = spiderManager