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
    levelId: 4
  },
  90002: {
    nickname: '周子衡',
    avatar: imageUrls[1],
    mobile: '13800138002',
    levelId: 1
  },
  90003: {
    nickname: '陈雨桐',
    avatar: imageUrls[2],
    mobile: '13800138003',
    levelId: 6
  },
  90004: {
    nickname: '沈知夏',
    avatar: imageUrls[3],
    mobile: '13800138004',
    levelId: 3
  },
  90005: {
    nickname: '顾明远',
    avatar: imageUrls[4],
    mobile: '13800138005',
    levelId: 1
  }
}

const levelTemplates = [
  {
    id: 1,
    name: '普通会员',
    experience: 0,
    level: 1,
    discountPercent: 100,
    icon: imageUrls[0],
    backgroundUrl: imageUrls[1]
  },
  {
    id: 3,
    name: '银卡会员',
    experience: 300,
    level: 2,
    discountPercent: 98,
    icon: imageUrls[2],
    backgroundUrl: imageUrls[3]
  },
  {
    id: 4,
    name: '金卡会员',
    experience: 800,
    level: 3,
    discountPercent: 95,
    icon: imageUrls[4],
    backgroundUrl: imageUrls[5]
  },
  {
    id: 5,
    name: '铂金会员',
    experience: 1500,
    level: 4,
    discountPercent: 92,
    icon: imageUrls[6],
    backgroundUrl: imageUrls[7]
  },
  {
    id: 6,
    name: '黑金会员',
    experience: 3000,
    level: 5,
    discountPercent: 88,
    icon: imageUrls[8],
    backgroundUrl: imageUrls[0]
  }
]

const noticeTemplates = [
  {
    id: 1,
    title: '会员积分到账说明',
    content:
      '<p>线上下单后积分会在订单完成后的 30 分钟内自动发放，请在会员中心留意积分变动。</p><p>如遇到售后退款，相关积分将按规则同步回退。</p>',
    type: 1,
    status: 0,
    createTime: '2026-03-11 09:30:00'
  },
  {
    id: 2,
    title: '处方药审核时效提醒',
    content:
      '<p>工作日 08:00 至 22:00 提交的处方订单，通常会在 15 分钟内完成药师审核。</p><p>夜间订单将于次日优先处理，请保持联系方式畅通。</p>',
    type: 2,
    status: 0,
    createTime: '2026-03-12 10:00:00'
  }
]

const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`

const sqlString = (value) => {
  if (value === undefined || value === null) {
    return 'NULL'
  }
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
}

const runSsh = (command) => {
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

  return execFileSync('bash', ['-lc', sshCommand], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  })
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
    `pharmacy-member-marketing-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`
  )
  writeFileSync(sqlFile, sql, 'utf8')
  try {
    return runSshWithInputFile(mysqlCommand, sqlFile)
  } finally {
    unlinkSync(sqlFile)
  }
}

const createBackup = () => {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const backupPath = `/root/pharmacy-member-marketing-backup-${stamp}.sql.gz`
  const command = `bash -lc "docker exec -e MYSQL_PWD=${shellQuote(
    MYSQL_ROOT_PASSWORD
  )} ${shellQuote(
    MYSQL_CONTAINER
  )} mysqldump --default-character-set=utf8mb4 -uroot ${shellQuote(
    MYSQL_DATABASE
  )} member_level member_user system_notice | gzip > ${shellQuote(backupPath)}"`
  runSsh(command)
  return backupPath
}

const buildSql = () => {
  const statements = []

  levelTemplates.forEach((item) => {
    statements.push(`
      UPDATE member_level
      SET name = ${sqlString(item.name)},
          experience = ${item.experience},
          level = ${item.level},
          discount_percent = ${item.discountPercent},
          icon = ${sqlString(item.icon)},
          background_url = ${sqlString(item.backgroundUrl)},
          status = 0
      WHERE id = ${item.id};
    `)
  })

  Object.entries(memberProfiles).forEach(([id, profile]) => {
    statements.push(`
      UPDATE member_user
      SET nickname = ${sqlString(profile.nickname)},
          name = ${sqlString(profile.nickname)},
          avatar = ${sqlString(profile.avatar)},
          mobile = ${sqlString(profile.mobile)},
          level_id = ${profile.levelId}
      WHERE id = ${Number(id)};
    `)
  })

  noticeTemplates.forEach((item) => {
    statements.push(`
      UPDATE system_notice
      SET title = ${sqlString(item.title)},
          content = ${sqlString(item.content)},
          type = ${item.type},
          status = ${item.status},
          create_time = ${sqlString(item.createTime)}
      WHERE id = ${item.id};
    `)
  })

  statements.push(`
    DELETE FROM member_level
    WHERE id NOT IN (${levelTemplates.map((item) => item.id).join(', ')});
  `)

  return statements.join('\n')
}

const verificationSql = `
  SELECT 'fake_member_level' AS metric, COUNT(*) AS total
  FROM member_level
  WHERE name REGEXP '^流程等级' OR level > 20
  UNION ALL
  SELECT 'member_profile_issue', COUNT(*)
  FROM member_user
  WHERE id IN (90001, 90002, 90003, 90004, 90005)
    AND (nickname REGEXP '^用户[0-9]+$' OR avatar = '' OR avatar IS NULL OR mobile = '' OR mobile IS NULL OR level_id IS NULL)
  UNION ALL
  SELECT 'notice_placeholder', COUNT(*)
  FROM system_notice
  WHERE title LIKE '维护通知：2018%'
     OR title = '项目的公众'
     OR content LIKE '%test.pharmacy.pharmacy.cn%';
`

const main = async () => {
  const before = mysqlQuery(`
    SELECT COUNT(*) FROM member_level WHERE name REGEXP '^流程等级' OR level > 20;
    SELECT COUNT(*) FROM system_notice WHERE title LIKE '维护通知：2018%' OR title = '项目的公众' OR content LIKE '%test.pharmacy.pharmacy.cn%';
  `)
    .trim()
    .split('\n')

  console.log(`待处理会员等级异常: ${before[0] || 0}`)
  console.log(`待处理公告异常: ${before[1] || 0}`)

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
    ${buildSql()}
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
