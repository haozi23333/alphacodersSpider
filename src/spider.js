/**
 * Created by haozi on 4/16/2017.
 * 暂时没有处理异常
 *
 * 策略 1   异步全部一起下载
 *      2   开一定的线程异步下载
 *      3   开一定的线程同步下载
 */

//
// import request from 'request'
// import progress from 'request-progress'
// import fs from 'fs'
// import {EventEmitter} from 'events'

const request = require('request')
const fs = require('fs')


const spiderManager = require('./spiderManager')





// request.defaults({'proxy':'http://127.0.0.1:1080'})

class spider {
    /**
     *  爬虫
     * @param keyword       关键字                 必须
     * @param outDir        输出目录               必须
     * @param maxPage       最大爬取得页数          默认99999
     * @param maxProcess    最大下载进程数量        默认50
     */
    constructor (keyword, outDir, maxPage, maxProcess ) {
        if(!keyword || !outDir){
            throw "参数错误"
        }
        this.baseUrl = 'https://wall.alphacoders.com/search.php?search=' + keyword.replace(/ /g, "+")
        this.maxPage = maxPage || 99999
        this.pageCount = 0
        this.searchMaxPage = maxPage
        this.keyword = keyword
        this.imageList = []
        this.outDir = outDir
        this.maxProcess = maxProcess || 50
        console.log(`url -> ${this.baseUrl}`)
    }

    /**
     * 初始化爬虫
     * @returns {Promise.<void>}
     */
    async pa (){
        try {
            this.pageCount = await this.getPageCount()
            this.maxPage = this.maxPage > this.pageCount ? this.pageCount : this.maxPage
            console.log(`一共找到 ${this.pageCount} 页`)
            await this.getAllImageList()
            console.log(`一共找到 ${this.imageList.length} 张 qwq  马上开始爬~~~~~~`)
            const manager = new spiderManager(this.imageList, this.outDir , this.maxProcess)
            manager.on('progress', state => {
                console.log(`进度 ${Math.floor(　state * 100)} %  预估时间 ...`)
            })
            await manager.awit()
            console.log('全部完成了 撒花')
        }catch (e){
            throw e
        }
    }

    /**
     * 将找到的
     * @returns {Promise.<void>}
     */
    async getAllImageList (){
        try{
            for(let i = 1; (i <= this.pageCount && i <= this.maxPage) ; i++){
                console.log(`正在搜寻第 ${i} 页 的图 请稍等.......`);
                (await this.getPageImageList(i)).map( v => this.imageList.push(v.replace(/thumb-\d+-/, "")))
            }
        }catch (e){
            throw e
        }
    }

    /**
     * 获取关键词最大图片页数
     * @param body
     * @returns {*}
     */
    async getPageCount () {
        try{
            const res =  (await this.getPage(this.baseUrl)).match(new RegExp(`search.php\\?search\=${this.keyword.replace(/ /g, "\\+").toLowerCase()}&amp;page=\\d{0,}`, 'g'))
        if(!res){
            return 1
        }else {
            return res.map(v => Number(v.split('=').pop())).sort((a, b) => a -b).pop()
        }
        }catch (e){
            throw e
        }
    }

    async getPageImageList(page) {
        try{
            const res = (await this.getPage(this.baseUrl + '&page=' + page)).match(/https:\/\/images\d{0,}\.alphacoders\.com\/\d{0,}\/thumb-\d{0,}-\d{0,}\.\w{0,4}/g)
            if(!res){
                return []
            }else {
                console.log(`page -> ${page} 找到了 ${res.length} 张 qwq`)
                return res
            }
        }catch (e){
            throw e
        }
    }

    downloadImage (imageUrl, callback){
        if (callback){
            new spiderDownload(imageUrl, 'C:/Users/haozi/Desktop/BZ/').on('progress', state => {
                console.log(`任务ID：${imageUrl.split('_').pop()} 完成进度： ${state.percent * 100 + '%'} 速度： ${Math.floor(state.speed / 512 / 1024 * 100) / 100 } /M/s`)
            }).on('error', err => {
                throw err
            })
        }else {
            return new Promise((s, j) => {
                try{
                    new spiderDownload(imageUrl, '../download').on('end', () => s()).on('err', err => j(err)).on('progress', state => {
                        console.log(`任务ID：${imageUrl.split('_').pop()} 完成进度： ${state.percent * 100 + '%'} 速度： ${Math.floor(state.speed / 512 / 1024 * 100) / 100 }  /M/s`)
                    }).on('error', err => j(err))
                }catch(e) {
                    j(e)
                }
            })
        }
    }
    /**
     * 获取页面数据
     * @param url   需要被get获取的地址
     * @returns {Promise}
     */
    getPage (url) {
        return new Promise((s, j) => {
            request.get(url, (err, res, body) => {
                if(err)
                    j(err)
                else {
                    if(res.statusCode == 200){
                        s(body)
                    }else {
                        j(new Error(`url -> ${url}  statusCode = ${res.statusCode}`))
                    }
                }
            })
        })
    }
}


module.exports = spider
