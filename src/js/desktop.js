/*
 *変更の書式変更
 * Copyright (c) 2024 noz-23
 *  https://github.com/noz-23/
 *
 * Licensed under the MIT License
 * 
 *  利用：
 *   JQuery:
 *     https://jquery.com/
 *     https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js
 *   
 *   jsrender:
 *     https://www.jsviews.com/
 *     https://cdnjs.cloudflare.com/ajax/libs/jsrender/0.9.91/jsrender.min.js
 *
 *   tinyColorPicker and colors :
 *     https://github.com/PitPik/tinyColorPicker
 *     https://cdnjs.cloudflare.com/ajax/libs/tinyColorPicker/1.1.1/jqColorPicker.min.js
 * 
 *  参考：
 *   New Condition Format plug-in
 *    Copyright (c) 2016 Cybozu
 *
 *    Licensed under the MIT License
 *
 * History
 *  2024/04/03 0.1.0 初版
 *
 */

jQuery.noConflict();

(async ( PLUGIN_ID_) => {
  'use strict';

  const IFRAME_DATA ='iframeData';	// 重複表示防止用のid名

   const EVENTS =[
    'app.record.detail.show', // 詳細表示
    //'app.record.create.show', // 作成表示
    //'app.record.edit.show',   // 編集表示
  ];
  kintone.events.on(EVENTS, async (events_) => {
    console.log('events_:%o',events_);

    var linkUrl = location.href;
    console.log("linkUrl:%o",linkUrl);

    if( events_.record.$revision.value==1)
    {
      // 新規作成は何もしない
      return events_;
    }

    if( linkUrl.includes('&revision=') ==true)
    {
      // 変更点表示はそのままDOM利用できる
      await listHistoryFeild(document);

      return events_;
    }

    // 変更点とかは取得しないとダメ → DOM 利用しないとだめ
    var linkPattern =/^https:\/\/([a-zA-Z0-9-+_]+).cybozu.(com|net)\/k\/[0-9]+\/show#record=[0-9]+/;
    var match = linkUrl.match(linkPattern);
    console.log("match:%o",match);
    if (!match) {
      return events_;
    }
        
    // KintoneInKintoneの応用
    // 変更点表示で｢&tab=history&mode=show&revision=｣を追加した形式のiframeを表示

    // "https://*.cybozu.com/k/742/show#record=1" 形式のURLが入る
    // 公式でない引数の使い方のため、出来なくなるかもです
    var iframeSrc =match[0] +"&tab=history&mode=show&revision="+events_.record.$revision.value;
    console.log("iframeSrc:%o",iframeSrc);
    
    // 重複表示防止
    var frame = document.getElementById(IFRAME_DATA);
    if( frame !=null || frame !=undefined)
    {
      // 詳細表示後、編集などすると同じものが増えるのでIDで重複表示防止
      frame.remove();
    }

    // <iframe></iframe>タグの作成
    // css 化する予定
    frame=document.createElement("iframe");
    frame.id =IFRAME_DATA;
    frame.src = iframeSrc;
    // 実際は非表示
    frame.width ='0%';
    frame.height ='0%';
    console.log("frame:%o",iframeSrc);

    // iframeの追加
    // スペースでの割り当ての場合、｢contentWindow.onload｣が処理しないため、document.bodyで一番下に追加
    document.body.appendChild(frame);
      // iframe 読み込み後の処理
    frame.contentWindow.onload = async function (){
      var doc =document.getElementsByTagName("iframe")[0].contentWindow.document;
      console.log("doc:%o",doc);
  
      await listHistoryFeild(doc);
	  };
	  
    return events_;
  });


  /*
   * 引数　document_:変更履歴を検索するDOM
   * 戻り値 なし
   */
  async function listHistoryFeild ( document_){
    console.log('listHistoryFeild location.href:%o',location.href);
    // Kintone プラグイン 設定パラメータ
    const config = kintone.plugin.app.getConfig(PLUGIN_ID_);
    console.log('config:%o',config);
    // 
    const textColor=config['paramTextColor'];
    // 背景色
    const backColor=config['paramBackColor'];
    // 文字の大きさ
    const textSize=config['paramTextSize'];
    // 文字装飾
    const textFont=config['paramTextFontEnd'];

    // 変更履歴の検索
    var listHistory =document_.getElementsByClassName('itemlist-gaia-history');
    console.log('listHistory:%o',listHistory);

    if(listHistory.length ==0)
    {
      return events_;
    }

    // 一番上の変更履歴
    var history =listHistory[0];
    console.log('history:%o',history);

    var listModLabel =history.getElementsByClassName('itemlist-history-label-gaia');
    console.log('listModLabel:%o',listModLabel);

    // 履歴で出ているラベル名の取得
    var listLabel =[];
    for(var label of listModLabel){
      var text =label.innerText;
      listLabel.push(text.substring(0,text.length-2));
    }
    console.log('listLabel:%o',listLabel);

    // フィールドを取得してラベル名を検索
    var listFeild =await kintone.api(kintone.api.url('/k/v1/app/form/fields', true), 'GET',{app:kintone.app.getId()});
    console.log('listFeild:%o',listFeild);

    for (const key in listFeild.properties){
      //console.log("properties key:%o",key);
      try {
        const prop = listFeild.properties[key];

        const find =listLabel.find( f => f ==prop.label)

        if(typeof find ==='undefined'){
          continue;
        }
        
        // 検索であるラベル名=変更しているの書式変更
        console.log("properties key:%o",key);

        var element =kintone.app.record.getFieldElement(prop.code);
        console.log("element:%o",element);

        element.style.color=textColor;
        element.style.backgroundColor=backColor;
        element.style.fontSize =textSize;
        element.style.textDecoration = textFont;
      }
      catch (error) {
        console.log("error:%o",error);
      }
    }
  };

})(kintone.$PLUGIN_ID);
