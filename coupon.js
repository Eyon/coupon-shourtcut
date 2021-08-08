'use strict';

const apikey = "你的订单侠apikey"
const taobao = "http://api.tbk.dingdanxia.com/tbk/id_privilege"
const taobao_tkl = "http://api.tbk.dingdanxia.com/tbk/tkl_privilege"
const jd = "http://api.tbk.dingdanxia.com/jd/jy_privilege2"

const apiRequest = async function(urlType, data) {

	var url, dymkey

	if (urlType === "taobao") {
		url = taobao
		dymkey = "id"
	}
	if (urlType === "taobao_tkl") {
		url = taobao_tkl
		dymkey = "tkl"
	}
	if (urlType === "jd") {
		url = jd
		dymkey = "materialId"
	}

	return await uniCloud.httpclient.request(url, {
		method: "POST",
		data: {
			apikey: apikey,
			[dymkey]: data,
			autoSearch:true
		},
		dataType: 'json'
	})
}

exports.main = async (event, context) => {
	let data = (JSON.parse(event.body)).data
	var result
	if (data.includes('taobao') || data.includes('tb.cn')) {
		//传入淘宝链接的情况
		if (data.includes('https://item.taobao')) {
			let reg = new RegExp(/\d{8,15}/)
			result = await apiRequest('taobao', reg.exec(data)[0])
		}

		//传入淘宝淘口令的情况
		if (data.includes('https://m.tb.cn')) {
			result = await apiRequest('taobao_tkl', data)
		}

		//------------对淘宝返回数据进行处理-----------
		if (result.data.code === 200 && result.data.data.coupon_remain_count) {
			return result.data.data.coupon_click_url.replace('https://', 'taobao://')
		}
		if (result.data.code === 200 && result.data.data.coupon == 0) {
			return result.data.data.item_url.replace('https://', 'taobao://')
		}
		return data.replace('https://', 'taobao://')
	}
	//传入京东链接的情况。
	if (data.includes('jd.com')) {
		result = await apiRequest('jd', data)
		var url
		if(result.data.code === 200){
			if(result.data.data.is_coupon){
				url = result.data.data.couponInfo[0].link.substr(8)
			}
			else {
				url = result.data.data.shortUrl.substr(8)
			}
		} else {
			url = data.substr(8)
		}
		
		let params = {
			category: 'jump',
			des: 'getCoupon',
			url: url
		}
		return encodeURI(`openApp.jdMobile://virtual?params=${JSON.stringify(params)}`);		
	}
	return false
};
