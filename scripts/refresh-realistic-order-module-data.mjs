#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SERVER_HOST = process.env.SERVER_HOST || '101.201.42.83'
const SERVER_USER = process.env.SERVER_USER || 'root'
const MYSQL_CONTAINER = process.env.MYSQL_CONTAINER || 'pharmacy-mysql-shared'
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'pharmacy_pharmacy'
const REMOTE_ROOT_PASSWORD = process.env.REMOTE_ROOT_PASSWORD
const MYSQL_ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD
const DRY_RUN = process.argv.includes('--dry-run')

if (!REMOTE_ROOT_PASSWORD) {
  throw new Error('缺少 REMOTE_ROOT_PASSWORD 环境变量')
}

if (!MYSQL_ROOT_PASSWORD) {
  throw new Error('缺少 MYSQL_ROOT_PASSWORD 环境变量')
}

const imageUrls = Array.from({ length: 9 }, (_, index) => {
  const fileNo = String(index + 1).padStart(2, '0')
  return `https://azhe.tech/images/drugs/drug${fileNo}.jpg`
})

const memberProfiles = {
  90001: {
    nickname: '林可欣',
    avatar: imageUrls[0],
    mobile: '13800138001',
    receiverName: '林可欣',
    address: '北京市朝阳区望京西园三区 318号楼 1单元 101室'
  },
  90002: {
    nickname: '周子衡',
    avatar: imageUrls[1],
    mobile: '13800138002',
    receiverName: '周子衡',
    address: '北京市丰台区右安门外大街 88号院 5号楼 1202室'
  },
  90003: {
    nickname: '陈雨桐',
    avatar: imageUrls[2],
    mobile: '13800138003',
    receiverName: '陈雨桐',
    address: '北京市海淀区学院路 20号院 6号楼 1单元 502室'
  }
}

const expressTemplates = [
  { code: 'SF', name: '顺丰速运' },
  { code: 'JD', name: '京东快递' },
  { code: 'JDL', name: '京东物流' },
  { code: 'EMS', name: 'EMS国内特快' },
  { code: 'CNPOST', name: '邮政快递包裹' },
  { code: 'YTO', name: '圆通速递' },
  { code: 'ZTO', name: '中通快递' },
  { code: 'STO', name: '申通快递' },
  { code: 'YD', name: '韵达速递' },
  { code: 'DBKD', name: '德邦快递' },
  { code: 'DBKY', name: '德邦快运' },
  { code: 'JT', name: '极兔速递' },
  { code: 'CAINIAO', name: '菜鸟速递' },
  { code: 'FWX', name: '丰网速运' },
  { code: 'KY', name: '跨越速运' },
  { code: 'ANE', name: '安能物流' },
  { code: 'YMDD', name: '壹米滴答' },
  { code: 'BEST', name: '百世快递' },
  { code: 'USPEED', name: '优速快递' },
  { code: 'TTKD', name: '天天快递' },
  { code: 'ZJS', name: '宅急送' },
  { code: 'SURE', name: '速尔快递' },
  { code: 'LHT', name: '联昊通快递' },
  { code: 'LB', name: '龙邦速运' },
  { code: 'JIAJI', name: '佳吉快运' },
  { code: 'JIAYI', name: '佳怡物流' },
  { code: 'TDHY', name: '天地华宇' },
  { code: 'ZTKY', name: '中铁快运' },
  { code: 'ZTWL', name: '中铁物流' },
  { code: 'ZYWL', name: '中邮物流' },
  { code: 'SINO', name: '中国外运' },
  { code: 'COSCO', name: '中远海运物流' },
  { code: 'CML', name: '招商美冷' },
  { code: 'ANDE', name: '安得智联' },
  { code: 'RRS', name: '日日顺供应链' },
  { code: 'SUNING', name: '苏宁物流' },
  { code: 'DADA', name: '达达快送' },
  { code: 'SHANSONG', name: '闪送' },
  { code: 'UUPT', name: 'UU跑腿' },
  { code: 'HLL', name: '货拉拉同城' },
  { code: 'JGSD', name: '京广速递' },
  { code: 'JIUYE', name: '九曳供应链' },
  { code: 'PULENG', name: '普冷国际' },
  { code: 'VANKE', name: '万纬冷链' },
  { code: 'RQWL', name: '荣庆物流' },
  { code: 'KERRY', name: '嘉里大通' },
  { code: 'BGWL', name: '宝供物流' },
  { code: 'EYT', name: '怡亚通物流' },
  { code: 'JZT', name: '九州通物流' },
  { code: 'GYWL', name: '国药物流' },
  { code: 'CRLOG', name: '华润医药商业物流' },
  { code: 'SPYL', name: '上药物流' },
  { code: 'SFCY', name: '顺丰冷运' },
  { code: 'JDJK', name: '京东健康物流' },
  { code: 'CNGY', name: '菜鸟供应链' },
  { code: 'DNWL', name: '丹鸟物流' },
  { code: 'ZCZY', name: '中储智运' },
  { code: 'FAW', name: '发网供应链' },
  { code: 'ZSD', name: '准时达国际供应链' },
  { code: 'MBLY', name: '满帮冷运' },
  { code: 'KZWL', name: '康展物流' },
  { code: 'AXD', name: '安鲜达' },
  { code: 'YCKY', name: '远成快运' },
  { code: 'KXTX', name: '卡行天下' },
  { code: 'FYKC', name: '福佑卡车' },
  { code: 'SFWL', name: '盛丰物流' },
  { code: 'SXJD', name: '顺心捷达' },
  { code: 'DTWL', name: '大田物流' },
  { code: 'XJWL', name: '新杰物流' },
  { code: 'SHWL', name: '盛辉物流' }
]

const productCatalog = {
  fever: [
    ['感冒灵颗粒 10g*9袋', '用于缓解感冒引起的头痛、发热、鼻塞和咽痛'],
    ['复方氨酚烷胺胶囊 12粒', '用于普通感冒及流行性感冒引起的发热、头痛和鼻塞'],
    ['布洛芬缓释胶囊 0.3g*20粒', '用于缓解轻至中度疼痛及普通感冒或流感引起的发热'],
    ['板蓝根颗粒 10g*20袋', '用于咽喉肿痛和风热感冒的辅助调理'],
    ['对乙酰氨基酚片 0.5g*20片', '用于普通感冒或流行性感冒引起的发热'],
    ['小儿氨酚黄那敏颗粒 6g*10袋', '用于儿童普通感冒及流行性感冒引起的发热和流涕']
  ],
  respiratory: [
    ['肺力咳合剂 100ml', '用于咳嗽痰多、支气管不适等呼吸道症状的调理'],
    ['川贝枇杷膏 150ml', '用于咽喉干痒、咳嗽痰黏等不适'],
    ['复方甘草片 50片', '用于镇咳祛痰，缓解咳嗽痰多'],
    ['氨溴索口服液 100ml', '用于急慢性呼吸道疾病引起的痰液黏稠和排痰困难'],
    ['急支糖浆 100ml', '用于外感风热所致咳嗽、咽喉肿痛'],
    ['孟鲁司特钠片 10mg*5片', '用于季节性过敏性鼻炎和哮喘的辅助管理']
  ],
  stomach: [
    ['健胃消食片 0.8g*36片', '用于脾胃虚弱所致食积、腹胀和消化不良'],
    ['蒙脱石散 3g*10袋', '用于成人及儿童急慢性腹泻的对症治疗'],
    ['多潘立酮片 10mg*30片', '用于消化不良、腹胀、恶心和呕吐的对症缓解'],
    ['铝碳酸镁咀嚼片 0.5g*24片', '用于胃酸过多引起的胃痛、烧心和反酸'],
    ['双歧杆菌三联活菌胶囊 210mg*12粒', '用于肠道菌群失调引起的腹泻、腹胀'],
    ['乳酸菌素片 0.4g*32片', '用于肠内异常发酵和消化不良的辅助治疗']
  ],
  cardio: [
    ['阿司匹林肠溶片 100mg*30片', '用于心脑血管高危人群的基础用药管理'],
    ['硝苯地平缓释片 20mg*30片', '用于高血压的长期管理'],
    ['复方丹参片 60片', '用于胸闷心悸及活血化瘀调理'],
    ['银杏叶片 19.2mg*24片', '用于改善血液循环和脑供血不足相关不适'],
    ['厄贝沙坦片 75mg*14片', '用于原发性高血压治疗'],
    ['辛伐他汀片 20mg*7片', '用于高脂血症和冠心病风险管理']
  ],
  skin: [
    ['炉甘石洗剂 100ml', '用于急性瘙痒性皮肤病和蚊虫叮咬后的止痒护理'],
    ['糠酸莫米松乳膏 5g', '用于湿疹、神经性皮炎及皮肤瘙痒症'],
    ['硝酸咪康唑乳膏 20g', '用于手足癣、体癣等真菌感染护理'],
    ['莫匹罗星软膏 15g', '用于脓疱病、毛囊炎等原发性皮肤感染'],
    ['丁酸氢化可的松乳膏 10g', '用于过敏性皮炎和湿疹引起的皮肤不适'],
    ['积雪苷霜软膏 20g', '用于外伤、烧伤及手术创面的辅助修复']
  ],
  vitamin: [
    ['维生素C咀嚼片 100片', '用于维生素C补充及日常免疫支持'],
    ['维生素B族片 60片', '用于维生素B族补充，改善口腔黏膜和疲劳状态'],
    ['钙维生素D片 60片', '用于钙和维生素D补充，适合骨骼健康管理'],
    ['葡萄糖酸锌口服液 10ml*12支', '用于儿童及成人锌元素补充'],
    ['叶酸片 0.4mg*31片', '用于孕前孕早期叶酸补充'],
    ['蛋白粉 900g', '用于营养补充及术后康复期能量支持']
  ],
  women: [
    ['妇炎洁洗液 260ml', '用于女性私护清洁和日常护理'],
    ['益母草颗粒 15g*10袋', '用于经期不调和气血运行调理'],
    ['乌鸡白凤丸 9g*10丸', '用于气血两虚及月经不调的调理'],
    ['保妇康栓 3.5g*12粒', '用于妇科炎症的辅助治疗'],
    ['女性乳酸菌护理凝胶 3支', '用于日常私密护理和菌群平衡维护'],
    ['胶原蛋白肽饮 50ml*10瓶', '用于女性日常营养补充和状态维护']
  ],
  child: [
    ['小儿肺热咳喘口服液 10ml*6支', '用于儿童肺热引起的咳嗽、咳黄痰'],
    ['妈咪爱枯草杆菌二联活菌颗粒 1g*10袋', '用于儿童消化不良、腹泻和便秘的肠道调理'],
    ['布洛芬混悬液 100ml', '用于儿童普通感冒或流感引起的发热'],
    ['儿童维生素D滴剂 24粒', '用于婴幼儿和儿童维生素D补充'],
    ['退热贴 4贴', '用于儿童发热时的物理降温护理'],
    ['儿童电解质泡腾片 20片', '用于发热、腹泻后的水分与电解质补充']
  ],
  pain: [
    ['双氯芬酸二乙胺乳胶剂 20g', '用于缓解肌肉、关节和软组织疼痛'],
    ['云南白药气雾剂 85g+30g', '用于跌打损伤、瘀血肿痛的护理'],
    ['麝香壮骨膏 7cm*10cm*6贴', '用于风湿关节痛、跌打扭伤和肌肉酸痛'],
    ['氟比洛芬凝胶贴膏 40mg*6贴', '用于颈肩腰腿痛及骨关节疼痛护理'],
    ['塞来昔布胶囊 0.2g*6粒', '用于骨关节炎和软组织炎症引起的疼痛'],
    ['骨化三醇软胶囊 0.25ug*10粒', '用于骨质疏松和骨代谢支持']
  ],
  eye: [
    ['玻璃酸钠滴眼液 5ml', '用于干眼症和长时间用眼后的润滑护理'],
    ['珍珠明目滴眼液 10ml', '用于视疲劳和眼部干涩不适'],
    ['萘敏维滴眼液 15ml', '用于缓解结膜充血、眼痒和视疲劳'],
    ['复方牛磺酸滴眼液 8ml', '用于长期看屏幕引起的眼部疲劳'],
    ['叶黄素酯软胶囊 60粒', '用于日常护眼和黄斑营养支持'],
    ['维生素A棕榈酸眼用凝胶 5g', '用于轻度角结膜干燥的辅助护理']
  ],
  wound: [
    ['云南白药创可贴 20片', '用于小面积开放性外伤的止血与包扎'],
    ['医用碘伏棉签 50支', '用于皮肤消毒和日常创口护理'],
    ['无菌敷贴 9cm*10cm*10片', '用于术后和日常伤口覆盖护理'],
    ['京万红软膏 20g', '用于轻度水火烫伤和皮肤创面的外用护理'],
    ['烫伤膏 25g', '用于轻度烫伤后的皮肤修复护理'],
    ['便携急救包 1套', '用于居家和出行场景的应急外用补给']
  ],
  device: [
    ['电子体温计 1支', '用于家庭日常体温监测'],
    ['上臂式电子血压计 1台', '用于家庭血压监测和慢病随访'],
    ['血糖仪试纸 50片', '用于家庭血糖检测和糖尿病日常管理'],
    ['医用雾化器 1台', '用于呼吸道疾病雾化吸入治疗'],
    ['医用外科口罩 50只', '用于日常防护和门诊随访场景'],
    ['制氧机鼻氧管 1套', '用于居家氧疗设备的日常耗材补充']
  ],
  tonic: [
    ['复方阿胶浆 20ml*12支', '用于气血两虚引起的头晕乏力和日常调养'],
    ['黄芪颗粒 15g*10袋', '用于益气固表和体虚人群调理'],
    ['阿胶口服液 20ml*12支', '用于女性营养补充和气血调养'],
    ['归脾丸 9g*10丸', '用于心脾两虚所致的失眠健忘和乏力'],
    ['酸枣仁胶囊 0.3g*24粒', '用于睡眠不稳和心神不宁的辅助调理'],
    ['口服营养液 200ml*8瓶', '用于术后、体弱和老年人群营养补充']
  ],
  urinary: [
    ['三金片 0.29g*72片', '用于尿路不适和泌尿系统常见症状调理'],
    ['热淋清颗粒 4g*8袋', '用于湿热下注所致的小便频急和尿痛'],
    ['前列舒通胶囊 0.38g*36粒', '用于前列腺相关不适的辅助调理'],
    ['排石颗粒 20g*10袋', '用于尿路结石辅助排石治疗'],
    ['金钱草颗粒 15g*10袋', '用于泌尿系统养护和排石辅助'],
    ['盐酸坦索罗辛缓释胶囊 0.2mg*10粒', '用于前列腺增生伴排尿困难的管理']
  ],
  neuro: [
    ['安神补脑液 10ml*10支', '用于失眠多梦、健忘乏力等状态调理'],
    ['褪黑素片 60片', '用于睡眠节律紊乱人群的辅助调整'],
    ['天麻头痛片 0.3g*24片', '用于头痛头晕和偏头痛的辅助缓解'],
    ['盐酸氟桂利嗪胶囊 5mg*20粒', '用于偏头痛和眩晕症的预防性治疗'],
    ['谷维素片 10mg*100片', '用于神经官能症和睡眠状态调整'],
    ['脑心舒口服液 10ml*10支', '用于失眠健忘、头晕乏力的辅助调理']
  ],
  liver: [
    ['护肝片 0.35g*100片', '用于慢性肝病和酒后肝脏状态辅助养护'],
    ['复方甘草酸苷片 25mg*21片', '用于肝功能异常和皮肤炎症的辅助治疗'],
    ['熊去氧胆酸片 50mg*30片', '用于胆汁淤积相关症状的辅助治疗'],
    ['水飞蓟宾胶囊 35mg*24粒', '用于化学性肝损伤和脂肪肝人群的养护'],
    ['葡醛内酯片 50mg*100片', '用于肝功能恢复期的辅助调理'],
    ['茵栀黄口服液 10ml*10支', '用于湿热黄疸和肝胆不适的调理']
  ],
  allergy: [
    ['氯雷他定片 10mg*6片', '用于缓解过敏性鼻炎、荨麻疹等过敏症状'],
    ['盐酸西替利嗪片 10mg*12片', '用于季节性过敏性鼻炎和皮肤瘙痒'],
    ['依巴斯汀片 10mg*7片', '用于慢性特发性荨麻疹及过敏性鼻炎治疗'],
    ['糠酸莫米松鼻喷雾剂 60喷', '用于季节性和常年性过敏性鼻炎'],
    ['扑尔敏片 4mg*100片', '用于过敏性疾病引起的打喷嚏、流涕和瘙痒'],
    ['抗过敏止痒凝胶 20g', '用于皮肤过敏后的外用舒缓护理']
  ],
  infection: [
    ['阿莫西林胶囊 0.25g*24粒', '用于敏感菌引起的呼吸道和泌尿道感染'],
    ['头孢克肟分散片 50mg*12片', '用于细菌感染引起的呼吸道及耳鼻喉不适'],
    ['左氧氟沙星胶囊 0.2g*12粒', '用于敏感菌所致的多部位感染治疗'],
    ['甲硝唑片 0.2g*24片', '用于厌氧菌感染和口腔炎症的辅助治疗'],
    ['蒲地蓝消炎口服液 10ml*12支', '用于疖肿、咽炎、扁桃体炎等炎症护理'],
    ['复方黄连素片 24片', '用于肠道感染引起的腹泻调理']
  ],
  male: [
    ['前列康片 0.57g*60片', '用于前列腺日常养护和排尿不适调理'],
    ['五子衍宗丸 60g', '用于肾虚精亏引起的腰膝酸软调理'],
    ['锁阳固精丸 200丸', '用于肾虚所致精关不固和体能恢复调理'],
    ['金匮肾气丸 360丸', '用于肾阳不足引起的腰膝酸软和夜尿频多'],
    ['复方玄驹胶囊 0.42g*36粒', '用于男性亚健康和疲劳恢复辅助调理'],
    ['男士抑菌洗液 260ml', '用于男性私护清洁和日常护理']
  ],
  seasonal: [
    ['藿香正气水 10ml*10支', '用于夏季暑湿感冒、头昏和肠胃不适'],
    ['晕车贴 6贴', '用于长途出行中晕车晕船的预防性护理'],
    ['高原安口服液 10ml*10支', '用于高原旅行前后的状态调理'],
    ['驱蚊止痒喷雾 60ml', '用于夏季户外防蚊和叮咬后舒缓'],
    ['润肺秋梨膏 180g', '用于换季咽干咳嗽和秋冬润燥护理'],
    ['春季抗敏喷雾 20ml', '用于花粉季节鼻腔舒缓和敏感防护']
  ],
  otc: [
    ['家庭常备药箱 1套', '用于家庭药箱基础补给和分类收纳'],
    ['OTC感冒护理组合 1盒', '用于感冒场景下的基础对症搭配'],
    ['肠胃应急组合 1盒', '用于居家和出差场景的肠胃应急备用'],
    ['外用护理组合 1盒', '用于创口、扭伤和皮肤外用护理'],
    ['维矿补充组合 1盒', '用于日常维生素和矿物质补充'],
    ['居家体检组合 1套', '用于基础健康监测和家庭常备用品整合']
  ],
  metabolism: [
    ['阿卡波糖片 50mg*30片', '用于2型糖尿病患者餐后血糖管理'],
    ['格列美脲片 2mg*15片', '用于2型糖尿病的基础血糖控制'],
    ['无糖蛋白营养粉 450g', '用于控糖期间的营养补充'],
    ['鱼油软胶囊 100粒', '用于血脂管理和心血管营养支持'],
    ['辅酶Q10软胶囊 60粒', '用于心脑血管和能量代谢支持'],
    ['膳食纤维粉 300g', '用于体重管理和糖脂代谢辅助']
  ],
  oral: [
    ['口腔溃疡散 3g', '用于口腔溃疡和牙龈红肿的辅助护理'],
    ['复方草珊瑚含片 24片', '用于咽喉肿痛和口腔异味缓解'],
    ['牙龈护理漱口水 500ml', '用于牙龈敏感和口腔清洁护理'],
    ['西瓜霜喷剂 20ml', '用于口腔溃疡和咽喉不适的局部护理'],
    ['口腔修复凝胶 15g', '用于牙龈出血和口腔创面的日常护理'],
    ['抗敏感牙膏 120g', '用于牙本质敏感和牙龈护理']
  ],
  rehab: [
    ['护腰固定带 1条', '用于久坐劳损和腰部支撑护理'],
    ['护膝保暖护具 1对', '用于膝关节支撑和运动保护'],
    ['筋膜冷敷凝胶 60g', '用于运动后肌肉放松和冷敷护理'],
    ['远红外理疗贴 6贴', '用于肩颈腰腿部位的热敷护理'],
    ['家用按摩球 1个', '用于运动后筋膜放松和康复训练'],
    ['助行手杖 1支', '用于老年人和术后恢复期辅助行走']
  ]
}

const orderRemarkTemplates = [
  '家庭常备药补货',
  '换季感冒药箱补充',
  '肠胃常备用药补充',
  '居家护理用品补货',
  '老人常用药复购',
  '儿童常备用药补充',
  '慢病管理复购',
  '药师推荐购药'
]

const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`

const sqlString = (value) => {
  if (value === undefined || value === null) {
    return 'NULL'
  }
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

const runSsh = (command, options = {}) => {
  const sshCommand = [
    `SSHPASS=${shellQuote(REMOTE_ROOT_PASSWORD)}`,
    'sshpass -e ssh',
    '-o StrictHostKeyChecking=no',
    '-o ConnectTimeout=10',
    '-o PreferredAuthentications=password',
    '-o PubkeyAuthentication=no',
    `${SERVER_USER}@${SERVER_HOST}`,
    shellQuote(command)
  ].join(' ')

  return execFileSync(
    'bash',
    ['-lc', sshCommand],
    {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    }
  )
}

const runSshWithInputFile = (command, inputFile) => {
  const sshCommand = [
    `SSHPASS=${shellQuote(REMOTE_ROOT_PASSWORD)}`,
    'sshpass -e ssh',
    '-o StrictHostKeyChecking=no',
    '-o ConnectTimeout=10',
    '-o PreferredAuthentications=password',
    '-o PubkeyAuthentication=no',
    `${SERVER_USER}@${SERVER_HOST}`,
    shellQuote(command),
    '<',
    shellQuote(inputFile)
  ].join(' ')

  return execFileSync('bash', ['-lc', sshCommand], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  })
}

const mysqlCommand = `docker exec -e MYSQL_PWD=${shellQuote(
  MYSQL_ROOT_PASSWORD
)} -i ${shellQuote(MYSQL_CONTAINER)} mysql --default-character-set=utf8mb4 -N -B -uroot -D ${shellQuote(MYSQL_DATABASE)}`

const mysqlQuery = (sql) => {
  const sqlFile = join(
    tmpdir(),
    `pharmacy-order-module-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`
  )
  writeFileSync(sqlFile, sql, 'utf8')
  try {
    return runSshWithInputFile(mysqlCommand, sqlFile)
  } finally {
    unlinkSync(sqlFile)
  }
}

const parseTsv = (text, columns) =>
  text
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const values = line.split('\t')
      return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']))
    })

const createBackup = () => {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const backupPath = `/root/pharmacy-order-module-backup-${stamp}.sql.gz`
  const dumpTables = [
    'trade_delivery_express',
    'trade_order',
    'trade_order_item',
    'trade_after_sale',
    'member_user',
    'product_spu',
    'product_sku'
  ].join(' ')
  const command = `bash -lc "docker exec -e MYSQL_PWD=${shellQuote(
    MYSQL_ROOT_PASSWORD
  )} ${shellQuote(
    MYSQL_CONTAINER
  )} mysqldump --default-character-set=utf8mb4 -uroot ${shellQuote(
    MYSQL_DATABASE
  )} ${dumpTables} | gzip > ${shellQuote(backupPath)}"`
  runSsh(command)
  return backupPath
}

const pickCatalogKey = (categoryName = '') => {
  if (/感冒|流感|退热|发热|秋冬感冒/.test(categoryName)) return 'fever'
  if (/呼吸|止咳|化痰|哮喘|鼻炎|咽喉|耳鼻喉/.test(categoryName)) return 'respiratory'
  if (/口腔|牙龈/.test(categoryName)) return 'oral'
  if (/肠胃|胃|消食|止泻|止吐|益生菌/.test(categoryName)) return 'stomach'
  if (/心脑|降压|冠心病|脑血管|血液循环|血压/.test(categoryName)) return 'cardio'
  if (/皮肤|湿疹|皮炎|真菌|止痒|祛疤|烫伤|驱蚊/.test(categoryName)) return 'skin'
  if (/维生素|钙|铁|锌|硒|叶酸|免疫|营养|DHA|乳铁蛋白|蛋白/.test(categoryName)) return 'vitamin'
  if (/妇科|经期|女性|私护|验孕|排卵|避孕/.test(categoryName)) return 'women'
  if (/儿科|儿童|婴幼儿|宝宝|新生儿/.test(categoryName)) return 'child'
  if (/骨科|关节|跌打|肌肉|腰椎|疼痛/.test(categoryName)) return 'pain'
  if (/眼科|干眼|视疲劳|护眼|滴眼/.test(categoryName)) return 'eye'
  if (/伤口|创可贴|碘伏|急救/.test(categoryName)) return 'wound'
  if (/器械|体温|血压检测|血糖监测|雾化/.test(categoryName)) return 'device'
  if (/中成药|保健|滋补|阿胶|燕窝|营养液|老年/.test(categoryName)) return 'tonic'
  if (/泌尿|前列腺|排石/.test(categoryName)) return 'urinary'
  if (/睡眠|情绪|失眠|焦虑|头痛|眩晕|安神/.test(categoryName)) return 'neuro'
  if (/护肝|肝胆|解酒/.test(categoryName)) return 'liver'
  if (/过敏|荨麻疹/.test(categoryName)) return 'allergy'
  if (/抗感染|抗菌|抗病毒/.test(categoryName)) return 'infection'
  if (/男科|体能恢复/.test(categoryName)) return 'male'
  if (/旅行|季节|高原|晕车|防暑|润燥/.test(categoryName)) return 'seasonal'
  if (/OTC/.test(categoryName)) return 'otc'
  if (/糖尿病|血糖|控糖|糖脂|降脂|代谢/.test(categoryName)) return 'metabolism'
  if (/康复|理疗|护腰|护膝|助行/.test(categoryName)) return 'rehab'
  return 'otc'
}

const buildProductPayload = (product, brandName, categoryName, index) => {
  const catalogKey = pickCatalogKey(categoryName)
  const templates = productCatalog[catalogKey] || productCatalog.otc
  const [genericName, usage] = templates[index % templates.length]
  const imageUrl = imageUrls[index % imageUrls.length]
  const sliderPicUrls = JSON.stringify([imageUrl, imageUrls[(index + 1) % imageUrls.length]])
  const name = genericName
  const introduction = `${usage}，适合药房常备和家庭日常储备。`
  const description = `<p>${usage}，适合门店陈列和家庭常备场景。</p>`
  const keyword = [brandName, genericName, categoryName].filter(Boolean).join(',')
  const marketPrice = Math.max(Number(product.market_price || 0), Number(product.price || 0) + 200)
  const virtualSalesCount = Math.max(Number(product.sales_count || 0), 36 + ((index % 12) + 1) * 7)
  const browseCount = Math.max(virtualSalesCount * 6, 200 + index * 11)
  return {
    name,
    keyword,
    introduction,
    description,
    picUrl: imageUrl,
    sliderPicUrls,
    marketPrice,
    virtualSalesCount,
    browseCount
  }
}

const buildTrackingNo = (expressCode, orderId) => `${expressCode}${String(20260312000000 + Number(orderId)).slice(-14)}`

const main = async () => {
  const expressRows = parseTsv(
    mysqlQuery(`
      SELECT id, code, name, sort
      FROM trade_delivery_express
      WHERE name REGEXP '^流程物流' OR code REGEXP '^FLOW' OR logo = 'https://azhe.tech/vite.svg'
      ORDER BY id ASC;
    `),
    ['id', 'code', 'name', 'sort']
  )

  if (expressRows.length > expressTemplates.length) {
    throw new Error(`物流公司模板不足，当前需要 ${expressRows.length} 条，模板仅 ${expressTemplates.length} 条`)
  }

  const productRows = parseTsv(
    mysqlQuery(`
      SELECT id, brand_id, category_id, price, market_price, stock, sales_count
      FROM product_spu
      WHERE name REGEXP '^流程药品' OR pic_url = 'https://azhe.tech/vite.svg'
      ORDER BY id ASC;
    `),
    ['id', 'brand_id', 'category_id', 'price', 'market_price', 'stock', 'sales_count']
  )

  const brandMap = new Map(
    parseTsv(mysqlQuery('SELECT id, name FROM product_brand ORDER BY id ASC;'), ['id', 'name']).map((item) => [
      Number(item.id),
      item.name
    ])
  )

  const categoryMap = new Map(
    parseTsv(mysqlQuery('SELECT id, name FROM product_category ORDER BY id ASC;'), ['id', 'name']).map((item) => [
      Number(item.id),
      item.name
    ])
  )

  const orderRows = parseTsv(
    mysqlQuery(`
      SELECT id, user_id, logistics_id, status, receiver_mobile
      FROM trade_order
      ORDER BY id ASC;
    `),
    ['id', 'user_id', 'logistics_id', 'status', 'receiver_mobile']
  )

  const memberRows = parseTsv(
    mysqlQuery(`
      SELECT id
      FROM member_user
      WHERE nickname REGEXP '^(测试用户|流程测试会员)' OR id IN (90001, 90002, 90003)
      ORDER BY id ASC;
    `),
    ['id']
  )

  const expressMap = new Map()
  const productPayloadMap = new Map()
  const sqlStatements = []

  expressRows.forEach((row, index) => {
    const template = expressTemplates[index]
    expressMap.set(Number(row.id), template)
    sqlStatements.push(`
      UPDATE trade_delivery_express
      SET code = ${sqlString(template.code)},
          name = ${sqlString(template.name)},
          logo = '',
          sort = ${index + 1}
      WHERE id = ${Number(row.id)};
    `)
  })

  memberRows.forEach((row, index) => {
    const memberId = Number(row.id)
    const profile = memberProfiles[memberId] || {
      nickname: `会员${memberId}`,
      avatar: imageUrls[index % imageUrls.length],
      mobile: `1390000${String(memberId).slice(-4)}`,
      receiverName: `会员${memberId}`,
      address: '北京市朝阳区建国路 88号院 3号楼 601室'
    }
    sqlStatements.push(`
      UPDATE member_user
      SET nickname = ${sqlString(profile.nickname)},
          name = ${sqlString(profile.nickname)},
          avatar = ${sqlString(profile.avatar)},
          mobile = ${sqlString(profile.mobile)}
      WHERE id = ${memberId};
    `)
  })

  productRows.forEach((row, index) => {
    const productId = Number(row.id)
    const brandName = brandMap.get(Number(row.brand_id)) || '品牌精选'
    const categoryName = categoryMap.get(Number(row.category_id)) || '家庭常备'
    const payload = buildProductPayload(row, brandName, categoryName, index)
    productPayloadMap.set(productId, payload)
    sqlStatements.push(`
      UPDATE product_spu
      SET name = ${sqlString(payload.name)},
          keyword = ${sqlString(payload.keyword)},
          introduction = ${sqlString(payload.introduction)},
          description = ${sqlString(payload.description)},
          pic_url = ${sqlString(payload.picUrl)},
          slider_pic_urls = ${sqlString(payload.sliderPicUrls)},
          market_price = ${payload.marketPrice},
          virtual_sales_count = ${payload.virtualSalesCount},
          browse_count = ${payload.browseCount}
      WHERE id = ${productId};
    `)
    sqlStatements.push(`
      UPDATE product_sku
      SET pic_url = ${sqlString(payload.picUrl)},
          market_price = GREATEST(COALESCE(market_price, 0), ${payload.marketPrice})
      WHERE spu_id = ${productId};
    `)
  })

  orderRows.forEach((row, index) => {
    const orderId = Number(row.id)
    const userId = Number(row.user_id)
    const logisticsId = row.logistics_id ? Number(row.logistics_id) : 0
    const profile = memberProfiles[userId]
    if (!profile) {
      return
    }
    const express = logisticsId ? expressMap.get(logisticsId) : undefined
    const trackingNo = express ? buildTrackingNo(express.code, orderId) : null
    const remark = orderRemarkTemplates[index % orderRemarkTemplates.length]
    sqlStatements.push(`
      UPDATE trade_order
      SET user_remark = ${sqlString(remark)},
          pay_channel_code = 'wx_lite',
          logistics_no = ${sqlString(trackingNo)},
          receiver_name = ${sqlString(profile.receiverName)},
          receiver_mobile = ${sqlString(profile.mobile)},
          receiver_detail_address = ${sqlString(profile.address)}
      WHERE id = ${orderId};
    `)
  })

  sqlStatements.push(`
    UPDATE trade_order_item item
    INNER JOIN product_spu spu ON spu.id = item.spu_id
    SET item.spu_name = spu.name,
        item.pic_url = spu.pic_url
    WHERE item.spu_name REGEXP '^流程药品' OR item.pic_url = 'https://azhe.tech/vite.svg';
  `)

  sqlStatements.push(`
    UPDATE trade_after_sale af
    INNER JOIN product_spu spu ON spu.id = af.spu_id
    INNER JOIN trade_order ord ON ord.id = af.order_id
    SET af.spu_name = spu.name,
        af.pic_url = spu.pic_url,
        af.apply_pic_urls = JSON_ARRAY(spu.pic_url),
        af.logistics_no = CASE
          WHEN ord.logistics_id IS NULL OR ord.logistics_no IS NULL OR ord.logistics_no = '' THEN NULL
          ELSE CONCAT(ord.logistics_no, 'R')
        END,
        af.apply_reason = '外包装轻微破损',
        af.apply_description = '收货后发现外盒有挤压痕迹，为保证用药体验申请退货退款。'
    WHERE af.spu_name REGEXP '^流程药品' OR af.pic_url = 'https://azhe.tech/vite.svg' OR af.logistics_no REGEXP '^AFTER-';
  `)

  const verificationSql = `
    SELECT 'express_fake' AS metric, COUNT(*) AS total
    FROM trade_delivery_express
    WHERE name REGEXP '^流程物流' OR code REGEXP '^FLOW' OR logo = 'https://azhe.tech/vite.svg'
    UNION ALL
    SELECT 'order_fake', COUNT(*)
    FROM trade_order
    WHERE user_remark LIKE '流程压测订单%' OR pay_channel_code = 'mock' OR receiver_name = '流程收货人' OR logistics_no REGEXP '^FLOWNO-'
    UNION ALL
    SELECT 'member_fake', COUNT(*)
    FROM member_user
    WHERE nickname REGEXP '^(测试用户|流程测试会员)'
    UNION ALL
    SELECT 'spu_fake', COUNT(*)
    FROM product_spu
    WHERE name REGEXP '^流程药品' OR pic_url = 'https://azhe.tech/vite.svg'
    UNION ALL
    SELECT 'sku_fake', COUNT(*)
    FROM product_sku
    WHERE pic_url = 'https://azhe.tech/vite.svg'
    UNION ALL
    SELECT 'aftersale_fake', COUNT(*)
    FROM trade_after_sale
    WHERE spu_name REGEXP '^流程药品' OR pic_url = 'https://azhe.tech/vite.svg' OR logistics_no REGEXP '^AFTER-';
  `

  console.log(`待更新物流公司: ${expressRows.length}`)
  console.log(`待更新会员: ${memberRows.length}`)
  console.log(`待更新商品/SPU: ${productRows.length}`)
  console.log(`待同步订单: ${orderRows.filter((item) => memberProfiles[Number(item.user_id)]).length}`)

  if (DRY_RUN) {
    console.log('dry-run 模式，不执行 SQL 更新')
    console.log(mysqlQuery(verificationSql).trim())
    return
  }

  const backupPath = createBackup()
  console.log(`远程备份已创建: ${backupPath}`)

  const sql = `
    SET NAMES utf8mb4;
    START TRANSACTION;
    ${sqlStatements.join('\n')}
    COMMIT;
    ${verificationSql}
  `

  const result = mysqlQuery(sql).trim()
  console.log('更新完成，校验结果如下:')
  console.log(result)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
