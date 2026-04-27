#!/usr/bin/env node

const BASE_URL = process.env.ADMIN_BASE_URL || 'https://azhe.tech/admin-api'
const TENANT_ID = process.env.TENANT_ID || '1'
const USERNAME = process.env.ADMIN_USERNAME || 'admin'
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const DRY_RUN = process.argv.includes('--dry-run')
const BRAND_NAME_PATTERN = /^流程品牌\d{14}-\d+$/

const logoUrls = Array.from({ length: 9 }, (_, index) => {
  const fileNo = String(index + 1).padStart(2, '0')
  return `https://azhe.tech/images/drugs/drug${fileNo}.jpg`
})

const brandNames = [
  '华润三九',
  '白云山',
  '云南白药',
  '同仁堂',
  '修正药业',
  '葵花药业',
  '仁和药业',
  '太极集团',
  '哈药集团',
  '扬子江药业',
  '石药集团',
  '齐鲁制药',
  '鲁南制药',
  '以岭药业',
  '东阿阿胶',
  '片仔癀',
  '江中药业',
  '天士力',
  '康缘药业',
  '达仁堂',
  '神威药业',
  '佛慈制药',
  '广誉远',
  '雷允上',
  '健民集团',
  '盘龙药业',
  '仲景宛西制药',
  '九芝堂',
  '马应龙',
  '联邦制药',
  '丽珠集团',
  '国药集团',
  '上海医药',
  '复星医药',
  '先声药业',
  '豪森药业',
  '恒瑞医药',
  '正大天晴',
  '贝达药业',
  '康弘药业',
  '华北制药',
  '华润双鹤',
  '昆药集团',
  '康恩贝',
  '海南海药',
  '亿帆医药',
  '贵州百灵',
  '羚锐制药',
  '济川药业',
  '珍宝岛药业',
  '亚宝药业',
  '华海药业',
  '海思科',
  '科伦药业',
  '安科生物',
  '华兰生物',
  '沃森生物',
  '康希诺',
  '智飞生物',
  '乐普医疗',
  '鱼跃医疗',
  '欧姆龙',
  '三诺生物',
  '罗氏诊断',
  '雅培',
  '强生医疗',
  '迈瑞医疗',
  '可孚医疗',
  '稳健医疗',
  '乐心医疗',
  '汤臣倍健',
  '养生堂',
  '纽崔莱',
  '钙尔奇',
  '善存',
  'Swisse',
  'Nature Made',
  '拜耳健康',
  '芬必得',
  '美林',
  '白加黑',
  '快克',
  '感康',
  '999',
  '护彤',
  '小葵花',
  '三精',
  '京都念慈菴',
  '慢严舒柠',
  '思密达',
  '吗丁啉',
  '达克宁',
  '扶他林',
  '开瑞坦',
  '泰诺',
  '万通药业',
  '中新药业',
  '万孚生物',
  '合生元',
  '美赞臣',
  '雀巢健康科学',
  '21金维他',
  '健力多',
  '斯达舒',
  '三九胃泰',
  '999皮炎平',
  '初元',
  '脑白金',
  '黄金搭档',
  '朗迪',
  '诺和诺德',
  '赛诺菲',
  '阿斯利康',
  '辉瑞',
  '默沙东',
  '罗氏制药',
  '诺华',
  '勃林格殷格翰',
  '礼来',
  '施维雅',
  '施贵宝',
  '武田制药',
  '安斯泰来',
  '第一三共',
  '卫材',
  '中美史克',
  '葛兰素史克',
  '惠氏制药',
  '费森尤斯卡比',
  '振东制药',
  '康芝药业',
  '香雪制药',
  '特一药业',
  '仙琚制药',
  '人福医药',
  '新华制药',
  '海王生物',
  '众生药业',
  '灵康药业',
  '普洛药业',
  '京新药业',
  '信立泰',
  '千金药业',
  '太龙药业',
  '康臣药业',
  '津药药业',
  '东北制药',
  '赛升药业',
  '京万红'
]

const focusPhrases = [
  '家庭常备用药',
  '感冒退热',
  '呼吸止咳',
  '肠胃调理',
  '心脑血管',
  '外用创伤护理',
  '中药滋补',
  '营养保健',
  '慢病管理',
  '医疗器械',
  '儿童用药',
  '妇科护理',
  '口腔与皮肤护理',
  '血糖血压监测',
  '骨科镇痛',
  '免疫支持'
]

const channelPhrases = [
  '连锁药房陈列',
  '线上药房选购',
  '家庭药箱常备',
  '慢病复购管理',
  '门店导购推荐',
  '处方配套管理'
]

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'tenant-id': TENANT_ID,
      ...(options.headers || {})
    }
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data?.msg || response.statusText}`)
  }
  if (data.code !== 0) {
    throw new Error(data.msg || `请求失败: ${path}`)
  }
  return data.data
}

const login = async () => {
  const data = await request('/system/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD
    })
  })
  if (!data?.accessToken) {
    throw new Error('登录成功但未返回 accessToken')
  }
  return data.accessToken
}

const getBrandPage = async (token, pageNo, pageSize) => {
  return request(`/product/brand/page?pageNo=${pageNo}&pageSize=${pageSize}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

const getAllBrands = async (token) => {
  const pageSize = 200
  const firstPage = await getBrandPage(token, 1, pageSize)
  const list = [...(firstPage.list || [])]
  const total = Number(firstPage.total || list.length)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
    const pageData = await getBrandPage(token, pageNo, pageSize)
    list.push(...(pageData.list || []))
  }

  return list
}

const updateBrand = async (token, payload) => {
  return request('/product/brand/update', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
}

const buildDescription = (brandName, index) => {
  const focus = focusPhrases[index % focusPhrases.length]
  const channel = channelPhrases[index % channelPhrases.length]
  return `${brandName} 在${focus}领域具有较高识别度，常见于${channel}场景。`
}

const buildPayload = (record, index) => ({
  id: Number(record.id),
  name: brandNames[index],
  picUrl: logoUrls[index % logoUrls.length],
  sort: index + 1,
  description: buildDescription(brandNames[index], index),
  status: Number(record.status ?? 0)
})

const main = async () => {
  const token = await login()
  const brands = await getAllBrands(token)
  const fakeBrands = brands
    .filter((item) => BRAND_NAME_PATTERN.test(item.name || ''))
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))

  if (!fakeBrands.length) {
    console.log('未发现需要清洗的流程品牌。')
    return
  }

  if (brandNames.length < fakeBrands.length) {
    throw new Error(`真实品牌模板数量不足，当前 ${brandNames.length}，需要 ${fakeBrands.length}`)
  }

  const updates = fakeBrands.map((record, index) => buildPayload(record, index))

  console.log(`发现 ${fakeBrands.length} 条流程品牌需要清洗。`)
  console.log(`预计更新 ${updates.length} 条记录。`)
  console.log('示例映射：')
  updates.slice(0, 10).forEach((item) => {
    console.log(`  ${item.id} -> ${item.name} (sort=${item.sort})`)
  })

  if (DRY_RUN) {
    console.log('当前为 dry-run，未执行实际更新。')
    return
  }

  for (const [index, payload] of updates.entries()) {
    await updateBrand(token, payload)
    if ((index + 1) % 20 === 0 || index === updates.length - 1) {
      console.log(`已更新 ${index + 1}/${updates.length}`)
    }
  }

  console.log('品牌数据清洗完成。')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
