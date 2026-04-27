#!/usr/bin/env node

const BASE_URL = process.env.ADMIN_BASE_URL || 'https://azhe.tech/admin-api'
const TENANT_ID = process.env.TENANT_ID || '1'
const USERNAME = process.env.ADMIN_USERNAME || 'admin'
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const DRY_RUN = process.argv.includes('--dry-run')
const FAKE_NAME_PATTERN = /^流程分类\d{14}-(T|L)\d+$/

const iconUrls = Array.from({ length: 9 }, (_, index) => {
  const fileNo = String(index + 1).padStart(2, '0')
  return `https://azhe.tech/images/drugs/drug${fileNo}.jpg`
})

const template = (name, children) => ({
  name,
  children
})

const legacyTemplate = (id, name, sort, description, iconIndex) => ({
  id,
  name,
  sort,
  description,
  iconIndex
})

const realisticTemplates = [
  template('感冒发热', ['普通感冒', '流感防治', '退热止痛', '咽喉肿痛']),
  template('呼吸系统', ['止咳化痰', '支气管炎', '哮喘护理', '鼻炎过敏']),
  template('消化系统', ['胃部不适', '肠道调理', '止泻止吐', '消食健胃']),
  template('心脑血管', ['降压调脂', '冠心病护理', '活血化瘀', '脑血管养护']),
  template('皮肤用药', ['湿疹皮炎', '真菌感染', '过敏止痒', '创面修复']),
  template('维生素矿物质', ['维生素补充', '钙铁锌硒', '叶酸营养', '免疫支持']),
  template('妇科用药', ['妇科炎症', '经期调理', '私密护理', '孕期营养']),
  template('儿科用药', ['儿童感冒', '儿童止咳', '儿童肠胃', '退热贴']),
  template('骨科疼痛', ['关节疼痛', '跌打损伤', '肌肉劳损', '腰椎护理']),
  template('眼科护理', ['干眼缓解', '视疲劳', '抗炎滴眼', '护眼营养']),
  template('耳鼻喉', ['咽喉含片', '鼻炎喷剂', '中耳护理', '扁桃体调理']),
  template('口腔护理', ['牙龈护理', '口腔溃疡', '口气清新', '牙周修复']),
  template('中成药', ['清热解毒', '健脾养胃', '益气补血', '安神助眠']),
  template('医疗器械', ['体温监测', '血压检测', '血糖监测', '雾化设备']),
  template('伤口护理', ['创可贴敷料', '碘伏消毒', '烫伤护理', '祛疤修复']),
  template('慢病管理', ['糖尿病护理', '高血压常备', '高血脂管理', '冠心病常备']),
  template('补益调养', ['补气养血', '人参滋补', '肝肾调理', '术后恢复']),
  template('泌尿系统', ['尿路感染', '前列腺护理', '肾脏保养', '排石辅助']),
  template('神经系统', ['偏头痛缓解', '失眠安神', '眩晕调理', '神经修复']),
  template('肝胆用药', ['护肝降酶', '胆囊调理', '解酒护肝', '脂肪肝辅助']),
  template('风湿免疫', ['风湿止痛', '类风湿护理', '骨质保养', '免疫调节']),
  template('内分泌', ['血糖管理', '甲状腺护理', '激素调节', '代谢支持']),
  template('抗感染用药', ['抗菌消炎', '抗病毒', '消炎镇痛', '家庭抗感染']),
  template('过敏防护', ['季节过敏', '荨麻疹护理', '皮肤过敏', '鼻敏感护理']),
  template('睡眠情绪', ['助眠安神', '焦虑舒缓', '神经放松', '情绪调节']),
  template('保健滋补', ['阿胶养颜', '燕窝滋补', '口服营养液', '免疫营养']),
  template('急救常备', ['急救包', '退热贴', '冰敷热敷', '应急外用']),
  template('计生用品', ['避孕套', '验孕检测', '排卵监测', '女性护理']),
  template('美容护肤', ['祛痘修复', '保湿舒缓', '敏感肌护理', '美白淡斑']),
  template('老年健康', ['心脑养护', '骨骼补钙', '关节护理', '老年营养']),
  template('抗菌消毒', ['酒精消毒', '碘伏棉片', '消毒湿巾', '家庭消杀']),
  template('血糖管理', ['血糖仪耗材', '控糖营养', '足部护理', '无糖补剂']),
  template('血压管理', ['电子血压计', '降压辅助', '心率监测', '血管养护']),
  template('肠胃养护', ['益生菌', '胃黏膜保护', '消食健胃', '肠易激调理']),
  template('免疫提升', ['维C补充', '乳铁蛋白', '锌硒补充', '免疫调节']),
  template('孕婴护理', ['孕妇营养', '新生儿护理', '婴幼儿常备', '宝宝洗护']),
  template('营养补充', ['蛋白粉', '膳食纤维', '微量元素', '氨糖软骨素']),
  template('戒烟解酒', ['戒烟辅助', '解酒护肝', '润喉清肺', '口气清新']),
  template('运动康复', ['运动护具', '按摩理疗', '肌贴冷敷', '运动损伤']),
  template('家庭常备', ['退烧止痛', '肠胃应急', '外伤处理', '夜间常备']),
  template('血液循环', ['活血化瘀', '静脉曲张', '循环改善', '手足冰凉']),
  template('男科护理', ['前列腺调理', '肾气滋补', '男性炎症', '体能恢复']),
  template('女性健康', ['私护清洁', '卵巢调理', '更年期支持', '胶原营养']),
  template('儿童营养', ['钙锌补充', 'DHA益智', '儿童维生素', '乳清营养']),
  template('呼吸防护', ['医用口罩', '雾化器械', '咽喉保湿', '空气消杀']),
  template('糖脂代谢', ['降脂辅助', '体重管理', '代谢支持', '控糖控脂']),
  template('疼痛管理', ['头痛缓解', '痛经护理', '关节疼痛', '神经性疼痛']),
  template('康复辅具', ['护腰护膝', '助行拐杖', '理疗贴敷', '家庭康复']),
  template('术后护理', ['伤口清洁', '营养恢复', '压力袜敷料', '疤痕护理']),
  template('旅行药包', ['晕车晕船', '驱蚊止痒', '肠胃应急', '高原防护']),
  template('季节防护', ['春季过敏', '夏季防暑', '秋冬感冒', '换季润燥']),
  template('OTC常备', ['感冒OTC', '肠胃OTC', '外用OTC', '维矿OTC'])
]

const legacyTemplates = [
  legacyTemplate(90001, '家庭常备', 53, '家庭药箱常备分类，覆盖感冒、止痛与肠胃应急场景', 0),
  legacyTemplate(90006, '感冒退热', 1, '用于感冒、发热与基础呼吸道不适场景', 5),
  legacyTemplate(90007, '镇痛消炎', 2, '用于疼痛缓解与常见炎症护理场景', 6),
  legacyTemplate(90008, '胃肠调理', 3, '用于胃部不适、腹泻与消化调理场景', 7),
  legacyTemplate(90002, '处方专区', 54, '用于需要药师指导或处方审核的药品归类', 1),
  legacyTemplate(90003, 'OTC自选', 55, '用于用户自主选购的非处方药品归类', 2),
  legacyTemplate(90004, '中药调理', 56, '用于中成药与传统调理类商品归类', 3),
  legacyTemplate(90005, '营养保健', 57, '用于维矿补充与日常营养保健类商品归类', 4)
]

const extractIndex = (name, marker) => {
  const match = name.match(new RegExp(`-${marker}(\\d+)$`))
  return match ? Number(match[1]) : 0
}

const sortByPlaceholderIndex = (marker) => {
  return (a, b) => {
    const first = extractIndex(a.name || '', marker)
    const second = extractIndex(b.name || '', marker)
    if (first !== second) {
      return first - second
    }
    return Number(a.id || 0) - Number(b.id || 0)
  }
}

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

const getCategoryList = async (token) => {
  return request('/product/category/list', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

const updateCategory = async (token, payload) => {
  return request('/product/category/update', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
}

const buildParentDescription = (children) => {
  return `覆盖${children.join('、')}等常见药房经营分类`
}

const buildChildDescription = (parentName, childName) => {
  return `用于${parentName}场景下的${childName}商品归类`
}

const buildPayload = (record, name, sort, description, picUrl) => ({
  id: record.id,
  parentId: Number(record.parentId || 0),
  name,
  picUrl,
  sort,
  status: Number(record.status ?? 0),
  description
})

const buildLegacyUpdates = (list) => {
  const recordMap = new Map((list || []).map((item) => [Number(item.id || 0), item]))
  return legacyTemplates.reduce((acc, item) => {
    const record = recordMap.get(item.id)
    if (!record) {
      return acc
    }
    acc.push(
      buildPayload(record, item.name, item.sort, item.description, iconUrls[item.iconIndex % iconUrls.length])
    )
    return acc
  }, [])
}

const main = async () => {
  if (realisticTemplates.length < 52) {
    throw new Error('真实分类模板数量不足，无法覆盖所有父分类')
  }

  const token = await login()
  const list = await getCategoryList(token)
  const fakeCategories = (list || []).filter((item) => FAKE_NAME_PATTERN.test(item.name || ''))
  const fakeParents = fakeCategories
    .filter((item) => Number(item.parentId || 0) === 0)
    .sort(sortByPlaceholderIndex('T'))
  const legacyUpdates = buildLegacyUpdates(list)

  if (fakeParents.length > realisticTemplates.length) {
    throw new Error(`父分类数量 ${fakeParents.length} 超出模板数量 ${realisticTemplates.length}`)
  }

  const updates = []

  fakeParents.forEach((parent, parentIndex) => {
    const templateItem = realisticTemplates[parentIndex]
    const children = fakeCategories
      .filter((item) => Number(item.parentId || 0) === Number(parent.id || 0))
      .sort(sortByPlaceholderIndex('L'))

    if (children.length > templateItem.children.length) {
      throw new Error(`父分类 ${parent.name} 的子分类数 ${children.length} 超出模板容量`)
    }

    const parentIcon = iconUrls[parentIndex % iconUrls.length]
    updates.push(
      buildPayload(
        parent,
        templateItem.name,
        parentIndex + 1,
        buildParentDescription(templateItem.children.slice(0, Math.max(children.length, 1))),
        parentIcon
      )
    )

    children.forEach((child, childIndex) => {
      const childName = templateItem.children[childIndex]
      const childIcon = iconUrls[(parentIndex + childIndex + 1) % iconUrls.length]
      updates.push(
        buildPayload(
          child,
          childName,
          childIndex + 1,
          buildChildDescription(templateItem.name, childName),
          childIcon
        )
      )
    })
  })

  updates.push(...legacyUpdates)

  if (!updates.length) {
    console.log('未发现需要清洗的分类数据。')
    return
  }

  console.log(`发现 ${fakeParents.length} 个流程父分类、${fakeCategories.length - fakeParents.length} 个流程子分类需要清洗。`)
  console.log(`发现 ${legacyUpdates.length} 条旧种子分类需要整理。`)
  console.log(`预计更新 ${updates.length} 条记录。`)
  console.log('示例映射：')
  updates.slice(0, 8).forEach((item) => {
    console.log(`  ${item.id} -> ${item.name} (sort=${item.sort})`)
  })

  if (DRY_RUN) {
    console.log('当前为 dry-run，未执行实际更新。')
    return
  }

  for (const [index, payload] of updates.entries()) {
    await updateCategory(token, payload)
    if ((index + 1) % 20 === 0 || index === updates.length - 1) {
      console.log(`已更新 ${index + 1}/${updates.length}`)
    }
  }

  console.log('分类数据清洗完成。')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
