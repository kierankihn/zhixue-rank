// Copyright (c) 2024 i@kierankihn.com
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://github.com/kierankihn/zhixue-rank.

// ==UserScript==
// @name         智学网排名查询
// @namespace    com.kierankihn.zhixuerank
// @version      1.0.0
// @author       Kieran Kihn
// @description  智学网排名查询
// @source       https://github.com/kierankihn/zhixue-rank
// @updateURL    https://github.com/kierankihn/zhixue-rank/blob/main/main.user.js
// @downloadURL  https://github.com/kierankihn/zhixue-rank/blob/main/main.user.js
// @supportURL   https://github.com/kierankihn/zhixue-rank/issues/new/
// @match        https://www.zhixue.com/activitystudy/web-report/index.html?from=web-container_top
// @grant        none
// ==/UserScript==

var rankData = {},
    rankElement = null;

/**
 * Calculate the rank info based on the data that is passed in
 *
 * @param {object} Data - the zhixue.com api returned data
 * 
 * @return {void} 
 */
function calcRank(Data) {
    rankData = [];
    for (let examData in Data) {
        let nowRankData = {
            offset: 0,
            name: Data[examData].tag.name,
            totalNum: Data[examData].totalNum,
            levelName: Data[examData].improveBar.levelScale
        };
        for (let nowLevel in Data[examData].levelList) {
            if (Data[examData].levelList[nowLevel].name === nowRankData.levelName) {
                nowRankData.offset += (100 - Data[examData].improveBar.offset) / 100.00 * (Data[examData].levelList[nowLevel].upperBound - Data[examData].levelList[nowLevel].lowBound);
                break;
            }
            nowRankData.offset += Data[examData].levelList[nowLevel].upperBound - Data[examData].levelList[nowLevel].lowBound;
        }
        nowRankData.rank = Math.round(nowRankData.totalNum * nowRankData.offset / 100.00);
        rankData.push(nowRankData);
    }
}

/**
 * Renders the rank data onto the report page.
 *
 * @param {void} 
 * @return {void}
 * 
 */
function render() {
    console.log(rankData);
    if (rankElement != null) {
        rankElement.remove();
    }
    rankElement = document.createElement('div');
    for (let singleRankData in rankData) {
        rankElement.innerHTML += `
        <div class="hierarchy">
            <div>
                <div class="general-head specific">${rankData[singleRankData].name}排名</div>
                <div>
                    <span class="bold wid_250">
                        <span class="increase">${rankData[singleRankData].rank}</span>名
                    </span>
                    <span class="specific">共 ${rankData[singleRankData].totalNum} 人</span>
                </div>
            </div>
        </div>`;
    }
    document.querySelector('#report > div > div.report > div > div.report-content').insertBefore(rankElement, document.querySelector('#report > div > div.report > div > div.report-content > div:nth-child(3)'));
}

/**
 * Send a patch request to the given URL and handle the response using the provided XHR object.
 *
 * @param {string} url - The URL to send the patch request to
 * @param {XMLHttpRequest} xhr - The XMLHttpRequest object used to send the request
 * @return {void} 
 * 
 */
function patchRequest(url, xhr) {
    if (url.indexOf('https://www.zhixue.com/zhixuebao/report/paper/getLevelTrend') !== -1) {
        xhr.addEventListener("load", function (proto) {
            const xhr = proto.currentTarget;
            if (xhr.readyState !== 4) {
                return;
            }
            console.log('785');
            calcRank(JSON.parse(xhr.response).result.list);
            render();
        });
    }
}

/**
 * Replaces the open method of XMLHttpRequest to intercept and patch the request before proceeding.
 *
 * @param {void} 
 * @return {void} 
 * 
 */
function inject() {
    XMLHttpRequest.prototype._open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        patchRequest(url, this);
        this._open(method, url, async, user, password);
    };
}

(function () {
    'use strict';
    inject();
})();