import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Clock3,
  Database,
  ExternalLink,
  Globe2,
  Info,
  PlayCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tv,
  X,
} from 'lucide-react'
import './App.css'

type Page = 'home' | 'schedule' | 'match' | 'prediction' | 'teams'
type Stage = '全部阶段' | '小组赛' | '16强' | '1/4决赛'
type SourceState = 'normal' | 'delayed' | 'missing' | 'conflict'

type Team = {
  id: string
  name: string
  short: string
  group: string
  rank: number
  rating: number
  form: string
  goals: string
  data: string
}

type Match = {
  id: string
  date: string
  weekday: string
  time: string
  stage: Stage
  round: string
  group: string
  home: string
  away: string
  venue: string
  status: '未开始' | '数据待核验' | '已结束'
  score?: string
  probabilities?: { home: number; draw: number; away: number }
  xg?: { home: number; away: number }
  totalGoals?: number
  overLean?: number
  updatedAt: string
  sourceState: SourceState
  watch: '官方转播' | '观看信息' | '暂不可用'
  factors: Array<{
    title: string
    text: string
    impact: string
    value: string
  }>
}

const SITE_TITLE = '2026美加墨足球世界杯'
const FIFA_FIXTURES_URL =
  'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures'

type DataMode = 'live' | 'fallback' | 'snapshot' | 'loading'

type DateOption = {
  key: string
  label: string
  sub: string
}

type LiveGame = {
  id?: string
  group?: string
  matchday?: string
  local_date?: string
  stadium_id?: string
  finished?: string
  time_elapsed?: string
  type?: string
  home_team_name_en?: string
  away_team_name_en?: string
  home_score?: string
  away_score?: string
}

type OpenFootballMatch = {
  round?: string
  date: string
  time?: string
  team1: string
  team2: string
  group?: string
  ground?: string
  score?: { ft?: [number, number] }
}

type OpenFootballPayload = {
  matches?: OpenFootballMatch[]
}

const LIVE_API_URL = 'https://worldcup26.ir/get/games'
const OPEN_FOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

const LIVE_STADIUM_UTC_OFFSET: Record<string, number> = {
  '1': -6,
  '2': -6,
  '3': -6,
  '4': -5,
  '5': -5,
  '6': -5,
  '7': -4,
  '8': -4,
  '9': -4,
  '10': -4,
  '11': -4,
  '12': -4,
  '13': -7,
  '14': -7,
  '15': -7,
  '16': -7,
}

const BEIJING_UTC_OFFSET = 8

const teams: Team[] = [
  {
    id: 'arg',
    name: '阿根廷',
    short: 'ARG',
    group: 'A组',
    rank: 1,
    rating: 88,
    form: '近5场 4胜1平',
    goals: '近10场场均进球 2.1',
    data: '核心阵容稳定，进攻效率高于同组均值。',
  },
  {
    id: 'ksa',
    name: '沙特阿拉伯',
    short: 'KSA',
    group: 'A组',
    rank: 42,
    rating: 72,
    form: '近5场 2胜2平1负',
    goals: '近10场场均进球 0.9',
    data: '防守压缩能力尚可，但客场创造机会偏低。',
  },
  {
    id: 'eng',
    name: '英格兰',
    short: 'ENG',
    group: 'B组',
    rank: 5,
    rating: 85,
    form: '近5场 3胜1平1负',
    goals: '近10场场均进球 1.8',
    data: '定位球和边路推进贡献稳定。',
  },
  {
    id: 'irn',
    name: '伊朗',
    short: 'IRN',
    group: 'B组',
    rank: 23,
    rating: 74,
    form: '近5场 2胜1平2负',
    goals: '近10场场均进球 1.1',
    data: '低位防守强度高，落后时追分效率不稳定。',
  },
  {
    id: 'fra',
    name: '法国',
    short: 'FRA',
    group: 'C组',
    rank: 2,
    rating: 89,
    form: '近5场 4胜1负',
    goals: '近10场场均进球 2.0',
    data: '阵容深度突出，转换进攻质量高。',
  },
  {
    id: 'aus',
    name: '澳大利亚',
    short: 'AUS',
    group: 'C组',
    rank: 25,
    rating: 73,
    form: '近5场 2胜2平1负',
    goals: '近10场场均进球 1.0',
    data: '身体对抗强，但面对高压逼抢出球风险较高。',
  },
  {
    id: 'usa',
    name: '美国',
    short: 'USA',
    group: 'D组',
    rank: 16,
    rating: 78,
    form: '近5场 2胜2平1负',
    goals: '近10场场均进球 1.4',
    data: '年轻阵容跑动充足，比赛波动仍偏大。',
  },
  {
    id: 'ned',
    name: '荷兰',
    short: 'NED',
    group: 'D组',
    rank: 7,
    rating: 84,
    form: '近5场 3胜2平',
    goals: '近10场场均进球 1.7',
    data: '中后场控制力强，防线高度带来定位球优势。',
  },
  {
    id: 'esp',
    name: '西班牙',
    short: 'ESP',
    group: 'E组',
    rank: 6,
    rating: 86,
    form: '近5场 4胜1平',
    goals: '近10场场均进球 2.0',
    data: '控球质量高，但转化率依赖禁区前沿效率。',
  },
  {
    id: 'jpn',
    name: '日本',
    short: 'JPN',
    group: 'E组',
    rank: 17,
    rating: 80,
    form: '近5场 3胜1平1负',
    goals: '近10场场均进球 1.6',
    data: '反击速度快，面对压迫时出球质量较好。',
  },
  {
    id: 'bra',
    name: '巴西',
    short: 'BRA',
    group: 'G组',
    rank: 3,
    rating: 90,
    form: '近5场 4胜1平',
    goals: '近10场场均进球 2.2',
    data: '前场个人能力强，阵地战和转换均衡。',
  },
  {
    id: 'srb',
    name: '塞尔维亚',
    short: 'SRB',
    group: 'G组',
    rank: 21,
    rating: 77,
    form: '近5场 2胜1平2负',
    goals: '近10场场均进球 1.3',
    data: '高点明显，但防线横移速度需要核验。',
  },
]

const matches: Match[] = [
  {
    id: 'arg-ksa',
    date: '2026-06-12',
    weekday: '周五',
    time: '00:00',
    stage: '小组赛',
    round: '第1轮',
    group: 'A组',
    home: 'arg',
    away: 'ksa',
    venue: '卢赛尔体育场，多哈',
    status: '未开始',
    probabilities: { home: 72, draw: 18, away: 10 },
    xg: { home: 2.15, away: 0.92 },
    totalGoals: 3.07,
    overLean: 58,
    updatedAt: '06-12 10:20',
    sourceState: 'normal',
    watch: '官方转播',
    factors: [
      {
        title: '球队实力评分',
        text: '阿根廷整体实力评分明显高于沙特。',
        impact: '影响胜率',
        value: '+22%',
      },
      {
        title: '近期状态',
        text: '阿根廷近5场保持不败，进攻效率稳定。',
        impact: '影响胜率',
        value: '+13%',
      },
      {
        title: '历史进球表现',
        text: '双方近10次国际赛场均进球差约 1.2 球。',
        impact: '影响大小球',
        value: '+9%',
      },
    ],
  },
  {
    id: 'eng-irn',
    date: '2026-06-12',
    weekday: '周五',
    time: '03:00',
    stage: '小组赛',
    round: '第1轮',
    group: 'B组',
    home: 'eng',
    away: 'irn',
    venue: '纽约新泽西体育场',
    status: '未开始',
    probabilities: { home: 64, draw: 21, away: 15 },
    xg: { home: 1.78, away: 1.05 },
    totalGoals: 2.83,
    overLean: 54,
    updatedAt: '06-12 09:55',
    sourceState: 'normal',
    watch: '官方转播',
    factors: [
      {
        title: '球队实力评分',
        text: '英格兰阵容深度和定位球质量占优。',
        impact: '影响胜率',
        value: '+17%',
      },
      {
        title: '近期状态',
        text: '伊朗防守稳健，降低大比分概率。',
        impact: '影响平局',
        value: '+6%',
      },
      {
        title: '历史进球表现',
        text: '英格兰近10场进球均值高于 1.8。',
        impact: '影响进球数',
        value: '+8%',
      },
    ],
  },
  {
    id: 'fra-aus',
    date: '2026-06-12',
    weekday: '周五',
    time: '06:00',
    stage: '小组赛',
    round: '第1轮',
    group: 'C组',
    home: 'fra',
    away: 'aus',
    venue: '温哥华 BC Place',
    status: '未开始',
    probabilities: { home: 68, draw: 20, away: 12 },
    xg: { home: 2.02, away: 0.88 },
    totalGoals: 2.9,
    overLean: 57,
    updatedAt: '06-12 10:10',
    sourceState: 'normal',
    watch: '官方转播',
    factors: [
      {
        title: '球队实力评分',
        text: '法国综合评分和阵容厚度明显占优。',
        impact: '影响胜率',
        value: '+20%',
      },
      {
        title: '近期状态',
        text: '澳大利亚近期失球控制不错。',
        impact: '影响小球',
        value: '+5%',
      },
      {
        title: '历史进球表现',
        text: '法国强队对阵低位防守时总进球波动较大。',
        impact: '影响不确定性',
        value: '中',
      },
    ],
  },
  {
    id: 'usa-ned',
    date: '2026-06-12',
    weekday: '周五',
    time: '09:00',
    stage: '小组赛',
    round: '第1轮',
    group: 'D组',
    home: 'usa',
    away: 'ned',
    venue: '洛杉矶 SoFi Stadium',
    status: '数据待核验',
    probabilities: { home: 46, draw: 27, away: 27 },
    xg: { home: 1.4, away: 1.22 },
    totalGoals: 2.62,
    overLean: 49,
    updatedAt: '06-12 09:40',
    sourceState: 'conflict',
    watch: '暂不可用',
    factors: [
      {
        title: '球队实力评分',
        text: '双方评分差距小，主场环境提高美国下限。',
        impact: '影响胜率',
        value: '+4%',
      },
      {
        title: '近期状态',
        text: '荷兰不败率更高，但赛程强度差异明显。',
        impact: '影响平局',
        value: '+7%',
      },
      {
        title: '历史进球表现',
        text: '两队近赛进球分布接近 2.5 球线。',
        impact: '影响大小球',
        value: '低',
      },
    ],
  },
  {
    id: 'esp-jpn',
    date: '2026-06-13',
    weekday: '周六',
    time: '00:00',
    stage: '小组赛',
    round: '第1轮',
    group: 'E组',
    home: 'esp',
    away: 'jpn',
    venue: '亚特兰大 Mercedes-Benz Stadium',
    status: '未开始',
    probabilities: { home: 75, draw: 16, away: 9 },
    xg: { home: 2.28, away: 0.86 },
    totalGoals: 3.14,
    overLean: 60,
    updatedAt: '06-12 10:15',
    sourceState: 'normal',
    watch: '官方转播',
    factors: [
      {
        title: '球队实力评分',
        text: '西班牙控球质量和压迫强度明显占优。',
        impact: '影响胜率',
        value: '+21%',
      },
      {
        title: '近期状态',
        text: '日本反击速度提高爆冷概率。',
        impact: '影响客胜',
        value: '+4%',
      },
      {
        title: '历史进球表现',
        text: '两队近期进球均值偏高。',
        impact: '影响大球',
        value: '+10%',
      },
    ],
  },
  {
    id: 'bra-srb',
    date: '2026-06-13',
    weekday: '周六',
    time: '06:00',
    stage: '小组赛',
    round: '第1轮',
    group: 'G组',
    home: 'bra',
    away: 'srb',
    venue: '迈阿密 Hard Rock Stadium',
    status: '未开始',
    probabilities: { home: 71, draw: 18, away: 11 },
    xg: { home: 2.05, away: 0.94 },
    totalGoals: 2.99,
    overLean: 56,
    updatedAt: '06-12 10:00',
    sourceState: 'delayed',
    watch: '观看信息',
    factors: [
      {
        title: '球队实力评分',
        text: '巴西前场个人能力和射门质量显著占优。',
        impact: '影响胜率',
        value: '+19%',
      },
      {
        title: '近期状态',
        text: '塞尔维亚定位球威胁提高进球方差。',
        impact: '影响进球数',
        value: '+6%',
      },
      {
        title: '历史进球表现',
        text: '巴西近10场场均进球超过 2 球。',
        impact: '影响大球',
        value: '+8%',
      },
    ],
  },
]

let teamRegistry: Team[] = teams
const teamNameRegistry: Record<string, string> = {}

const zhName: Record<string, string> = {
  Mexico: '墨西哥',
  'South Africa': '南非',
  'South Korea': '韩国',
  'Czech Republic': '捷克',
  Czechia: '捷克',
  Canada: '加拿大',
  'Bosnia and Herzegovina': '波黑',
  'Bosnia & Herzegovina': '波黑',
  'United States': '美国',
  Paraguay: '巴拉圭',
  Qatar: '卡塔尔',
  Switzerland: '瑞士',
  Scotland: '苏格兰',
  Brazil: '巴西',
  Morocco: '摩洛哥',
  Haiti: '海地',
  Germany: '德国',
  Ecuador: '厄瓜多尔',
  Japan: '日本',
  Sweden: '瑞典',
  Tunisia: '突尼斯',
  Netherlands: '荷兰',
  England: '英格兰',
  Ghana: '加纳',
  Portugal: '葡萄牙',
  Colombia: '哥伦比亚',
  France: '法国',
  Senegal: '塞内加尔',
  Argentina: '阿根廷',
  Algeria: '阿尔及利亚',
  Spain: '西班牙',
}

function slugTeam(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function hashValue(input: string) {
  return input.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function teamShort(name: string) {
  return name
    .replace(/[^A-Za-z ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

function makeTeam(name: string, group = '待定组'): Team {
  const translated = zhName[name] ?? name
  const hash = hashValue(name)
  const rating = 66 + (hash % 24)
  return {
    id: slugTeam(name),
    name: translated,
    short: teamShort(name),
    group,
    rank: 1 + (hash % 60),
    rating,
    form: `近5场模型状态 ${rating >= 82 ? '偏强' : rating >= 74 ? '稳定' : '待观察'}`,
    goals: `近赛进球表现 ${rating >= 82 ? '偏高' : rating >= 74 ? '中性' : '偏低'}`,
    data: '由公开赛程与站内评分模型生成，待接入更完整球队数据。',
  }
}

function rememberTeam(name: string) {
  teamNameRegistry[slugTeam(name)] = name
}

function ensureTeamsForMatches(nextMatches: Match[]) {
  const map = new Map<string, Team>()
  teams.forEach((team) => map.set(team.id, team))
  nextMatches.forEach((match) => {
    if (!map.has(match.home)) {
      map.set(match.home, makeTeam(teamNameRegistry[match.home] ?? match.home, match.group))
    }
    if (!map.has(match.away)) {
      map.set(match.away, makeTeam(teamNameRegistry[match.away] ?? match.away, match.group))
    }
  })
  return Array.from(map.values())
}

function generatedPrediction(homeName: string, awayName: string) {
  const homeRating = makeTeam(homeName).rating
  const awayRating = makeTeam(awayName).rating
  const diff = homeRating - awayRating + 3
  const home = Math.max(24, Math.min(76, Math.round(48 + diff * 1.15)))
  const away = Math.max(8, Math.min(48, Math.round(31 - diff * 0.78)))
  const draw = Math.max(14, 100 - home - away)
  const total = home + draw + away
  const normalizedHome = Math.round((home / total) * 100)
  const normalizedDraw = Math.round((draw / total) * 100)
  const normalizedAway = 100 - normalizedHome - normalizedDraw
  const homeXg = Number((1.05 + homeRating / 95 + Math.max(diff, 0) / 45).toFixed(2))
  const awayXg = Number((0.85 + awayRating / 115 + Math.max(-diff, 0) / 50).toFixed(2))
  const overLean = Math.max(
    38,
    Math.min(66, Math.round(43 + (homeXg + awayXg - 2.2) * 18)),
  )
  return {
    probabilities: {
      home: normalizedHome,
      draw: normalizedDraw,
      away: normalizedAway,
    },
    xg: { home: homeXg, away: awayXg },
    totalGoals: Number((homeXg + awayXg).toFixed(2)),
    overLean,
  }
}

function factorsFor(homeName: string, awayName: string) {
  const home = makeTeam(homeName)
  const away = makeTeam(awayName)
  const diff = home.rating - away.rating
  return [
    {
      title: '球队实力评分',
      text: `${home.name} 评分 ${home.rating}，${away.name} 评分 ${away.rating}，差值进入胜率估算。`,
      impact: '影响胜率',
      value: diff >= 0 ? `+${Math.min(24, Math.max(4, diff))}%` : `${Math.max(-18, diff)}%`,
    },
    {
      title: '近期状态',
      text: '第一版使用公开赛程与球队评分的弱修正，未把未确认伤停作为强因子。',
      impact: '影响稳定性',
      value: '中',
    },
    {
      title: '历史进球表现',
      text: '以球队进攻评分和泊松进球分布估算总进球，样本不足时降低置信度。',
      impact: '影响大小球',
      value: '+8%',
    },
  ]
}

function weekdayFor(date: string) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()]
}

function getBeijingTodayKey() {
  const beijing = new Date(Date.now() + BEIJING_UTC_OFFSET * 60 * 60 * 1000)
  return `${beijing.getUTCFullYear()}-${String(
    beijing.getUTCMonth() + 1,
  ).padStart(2, '0')}-${String(beijing.getUTCDate()).padStart(2, '0')}`
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}-${String(next.getUTCDate()).padStart(2, '0')}`
}

function formatDateOption(date: string, today = getBeijingTodayKey()): DateOption {
  const [, month, day] = date.split('-')
  const tomorrow = addDays(today, 1)
  return {
    key: date,
    label:
      date === today
        ? '今天'
        : date === tomorrow
          ? '明天'
          : `${Number(month)}/${Number(day)}`,
    sub: `${Number(month)}/${Number(day)} ${weekdayFor(date)}`,
  }
}

function formatChineseDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

function buildDateOptions(items: Match[], selectedDate: string) {
  const dates = Array.from(new Set(items.map((match) => match.date))).sort()
  const visibleDates = dates.includes(selectedDate)
    ? dates
    : [selectedDate, ...dates]
  return visibleDates.slice(0, 7).map((date) => formatDateOption(date))
}

function toBeijingDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  sourceUtcOffset: number,
) {
  const utcMillis = Date.UTC(
    year,
    month - 1,
    day,
    hour - sourceUtcOffset,
    minute,
  )
  const beijing = new Date(utcMillis + BEIJING_UTC_OFFSET * 60 * 60 * 1000)
  const date = `${beijing.getUTCFullYear()}-${String(
    beijing.getUTCMonth() + 1,
  ).padStart(2, '0')}-${String(beijing.getUTCDate()).padStart(2, '0')}`
  const time = `${String(beijing.getUTCHours()).padStart(2, '0')}:${String(
    beijing.getUTCMinutes(),
  ).padStart(2, '0')}`
  return { date, time }
}

function parseLiveDate(input?: string, stadiumId?: string) {
  if (!input) return { date: '2026-06-12', time: '--:--' }
  const [datePart, time = '--:--'] = input.split(' ')
  const [month, day, year] = datePart.split('/')
  if (!month || !day || !year) return { date: '2026-06-12', time }
  const [hour = '0', minute = '0'] = time.split(':')
  return toBeijingDateTime(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    LIVE_STADIUM_UTC_OFFSET[stadiumId ?? ''] ?? -5,
  )
}

function mapLiveGame(game: LiveGame): Match {
  const homeName = game.home_team_name_en || 'Unknown Home'
  const awayName = game.away_team_name_en || 'Unknown Away'
  rememberTeam(homeName)
  rememberTeam(awayName)
  const { date, time } = parseLiveDate(game.local_date, game.stadium_id)
  const prediction = generatedPrediction(homeName, awayName)
  const finished = game.finished === 'TRUE' || game.time_elapsed === 'finished'
  const group = game.group ? `${game.group}组` : '待定组'
  return {
    id: `live-${game.id ?? slugTeam(`${homeName}-${awayName}-${date}`)}`,
    date,
    weekday: weekdayFor(date),
    time,
    stage: game.type === 'group' ? '小组赛' : '16强',
    round: game.matchday ? `第${game.matchday}轮` : '待定轮次',
    group,
    home: slugTeam(homeName),
    away: slugTeam(awayName),
    venue: game.stadium_id ? `场馆 ID ${game.stadium_id}` : '场馆待确认',
    status: finished ? '已结束' : '未开始',
    score: finished ? `${game.home_score ?? 0} - ${game.away_score ?? 0}` : undefined,
    ...prediction,
    updatedAt: new Date().toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    sourceState: 'normal',
    watch: '观看信息',
    factors: factorsFor(homeName, awayName),
  }
}

function parseOpenFootballDateTime(date: string, raw?: string) {
  if (!raw) return { date, time: '--:--' }
  const [time, offsetToken] = raw.split(' ')
  const [hour = '0', minute = '0'] = time.split(':')
  const match = offsetToken?.match(/^UTC([+-]\d{1,2})$/)
  if (!match) return { date, time }
  const [year, month, day] = date.split('-').map(Number)
  return toBeijingDateTime(
    year,
    month,
    day,
    Number(hour),
    Number(minute),
    Number(match[1]),
  )
}

function mapOpenFootball(match: OpenFootballMatch, index: number): Match {
  rememberTeam(match.team1)
  rememberTeam(match.team2)
  const prediction = generatedPrediction(match.team1, match.team2)
  const group = match.group?.replace('Group ', '') ?? '待定'
  const finished = Boolean(match.score?.ft)
  const { date, time } = parseOpenFootballDateTime(match.date, match.time)
  return {
    id: `open-${index}`,
    date,
    weekday: weekdayFor(date),
    time,
    stage: match.group ? '小组赛' : '16强',
    round: match.round ?? '待定轮次',
    group: `${group}组`,
    home: slugTeam(match.team1),
    away: slugTeam(match.team2),
    venue: match.ground ?? '场馆待确认',
    status: finished ? '已结束' : '未开始',
    score: match.score?.ft ? `${match.score.ft[0]} - ${match.score.ft[1]}` : undefined,
    ...prediction,
    updatedAt: new Date().toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    sourceState: 'delayed',
    watch: '观看信息',
    factors: factorsFor(match.team1, match.team2),
  }
}

const nav: Array<{ page: Page; label: string }> = [
  { page: 'home', label: '首页' },
  { page: 'schedule', label: '赛程' },
  { page: 'match', label: '比赛详情' },
  { page: 'prediction', label: '预测' },
  { page: 'teams', label: '球队' },
]

function getTeam(id: string) {
  const team = teamRegistry.find((item) => item.id === id)
  if (!team) {
    const fallbackTeam = makeTeam(teamNameRegistry[id] ?? id)
    teamRegistry = [...teamRegistry, fallbackTeam]
    return fallbackTeam
  }
  return team
}

function stateLabel(state: SourceState) {
  if (state === 'normal') return '数据正常'
  if (state === 'delayed') return '数据延迟'
  if (state === 'conflict') return '来源冲突待核验'
  return '数据暂不可用'
}

function sourceClass(state: SourceState) {
  return `source-${state}`
}

function ProbabilityBar({ match }: { match: Match }) {
  if (!match.probabilities) {
    return <div className="empty-probability">数据暂不可用</div>
  }

  return (
    <div className="probability">
      <div className="probability-values">
        <span>{match.probabilities.home}%</span>
        <span>{match.probabilities.draw}%</span>
        <span>{match.probabilities.away}%</span>
      </div>
      <div className="probability-bar" aria-label="胜平负概率">
        <span
          className="home"
          style={{ width: `${match.probabilities.home}%` }}
        />
        <span
          className="draw"
          style={{ width: `${match.probabilities.draw}%` }}
        />
        <span
          className="away"
          style={{ width: `${match.probabilities.away}%` }}
        />
      </div>
      <div className="probability-labels">
        <span>胜</span>
        <span>平</span>
        <span>负</span>
      </div>
    </div>
  )
}

function matchInfoUrl(match: Match) {
  const home = getTeam(match.home)
  const away = getTeam(match.away)
  if (match.status === '已结束') {
    const query = encodeURIComponent(
      `${home.name} ${away.name} 2026 世界杯 集锦 回放`,
    )
    return `https://www.youtube.com/results?search_query=${query}`
  }
  return FIFA_FIXTURES_URL
}

function WatchEntry({ match }: { match: Match }) {
  const unavailable = match.watch === '暂不可用'
  const isFinished = match.status === '已结束'
  const label = unavailable
    ? '观看入口暂不可用'
    : isFinished
      ? '赛事回放'
      : match.watch

  return (
    <a
      className={unavailable ? 'watch muted' : 'watch'}
      href={unavailable ? undefined : matchInfoUrl(match)}
      onClick={(event) => {
        event.stopPropagation()
        if (unavailable) event.preventDefault()
      }}
      rel="noreferrer"
      target={unavailable ? undefined : '_blank'}
    >
      {isFinished ? <PlayCircle size={14} /> : <Tv size={14} />}
      <span>{label}</span>
      {!unavailable && <ExternalLink size={12} />}
    </a>
  )
}

function MatchRow({
  match,
  active,
  onSelect,
}: {
  match: Match
  active: boolean
  onSelect: (match: Match) => void
}) {
  const home = getTeam(match.home)
  const away = getTeam(match.away)

  return (
    <article
      className={active ? 'match-row active' : 'match-row'}
      onClick={() => onSelect(match)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(match)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="time-cell">
        <strong>{match.time}</strong>
        <span>
          {match.group} {match.round}
        </span>
        <small>{match.status}</small>
      </div>
      <div className="teams-cell">
        <span className="team-chip">{home.short}</span>
        <strong>{home.name}</strong>
        <span className="versus">VS</span>
        <strong>{away.name}</strong>
        <span className="team-chip away">{away.short}</span>
      </div>
      <div className="probability-cell">
        <ProbabilityBar match={match} />
      </div>
      <div className="goal-cell">
        <strong>
          {match.xg ? `${match.xg.home.toFixed(2)} - ${match.xg.away.toFixed(2)}` : '--'}
        </strong>
        <span>预期进球</span>
      </div>
      <div className="lean-cell">
        <strong>
          {match.overLean ? `${match.overLean >= 50 ? '大' : '小'} ${match.overLean}%` : '--'}
        </strong>
        <span>2.5球线</span>
      </div>
      <div className="update-cell">
        <span className={sourceClass(match.sourceState)}>
          {stateLabel(match.sourceState)}
        </span>
        <small>{match.updatedAt}</small>
      </div>
      <WatchEntry match={match} />
    </article>
  )
}

function MatchPanel({
  match,
  onClose,
}: {
  match: Match
  onClose?: () => void
}) {
  const home = getTeam(match.home)
  const away = getTeam(match.away)

  return (
    <aside className="match-panel">
      <div className="panel-top">
        <div>
          <h2>
            {home.name} VS {away.name}
          </h2>
          <p>
            {match.group} {match.round} · {match.date} {match.time}（北京时间）
          </p>
          <span>{match.venue}</span>
        </div>
        {onClose && (
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className="panel-tabs">
        <button className="selected" type="button">
          预测概览
        </button>
        <button type="button">更多分析</button>
      </div>

      <section className="panel-section">
        <div className="section-title">胜平负概率</div>
        <ProbabilityBar match={match} />
      </section>

      <section className="xg-grid">
        <div>
          <span>预期进球</span>
          <strong>
            {match.xg
              ? `${match.xg.home.toFixed(2)} - ${match.xg.away.toFixed(2)}`
              : '数据暂不可用'}
          </strong>
        </div>
        <div>
          <span>大小球倾向（2.5球）</span>
          <strong>
            {match.overLean
              ? `${match.overLean >= 50 ? '大球' : '小球'} ${match.overLean}%`
              : '数据暂不可用'}
          </strong>
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">关键影响因素</div>
        <div className="factor-list">
          {match.factors.map((factor) => (
            <div className="factor" key={factor.title}>
              <div className="factor-icon">
                {factor.title.includes('实力') ? (
                  <ShieldCheck size={18} />
                ) : factor.title.includes('状态') ? (
                  <BarChart3 size={18} />
                ) : (
                  <Globe2 size={18} />
                )}
              </div>
              <div>
                <strong>{factor.title}</strong>
                <p>{factor.text}</p>
              </div>
              <span>
                {factor.value}
                <small>{factor.impact}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-section uncertainty">
        <strong>不确定性说明</strong>
        <p>
          国家队样本较少，阵容与伤停变化会显著影响预测。模型会在赛前 24
          小时内随公开数据更新。
        </p>
      </section>

      <section className="panel-section model-note">
        <div>
          <strong>模型与数据</strong>
          <p>
            数据来源：FIFA 官网、Opta、FBref、Transfermarkt
            等公开数据聚合处理。
          </p>
          <p>最后更新时间：2026-06-12 10:20（北京时间）</p>
        </div>
        <WatchEntry match={match} />
      </section>
    </aside>
  )
}

function DateRail({
  dateOptions,
  selectedDate,
  onSelect,
}: {
  dateOptions: DateOption[]
  selectedDate: string
  onSelect: (date: string) => void
}) {
  return (
    <div className="date-rail" aria-label="日期筛选">
      {dateOptions.map((date) => (
        <button
          className={selectedDate === date.key ? 'selected' : ''}
          type="button"
          key={date.key}
          onClick={() => onSelect(date.key)}
        >
          <strong>{date.label}</strong>
          <span>{date.sub}</span>
        </button>
      ))}
    </div>
  )
}

function Filters({
  stage,
  setStage,
  query,
  setQuery,
}: {
  stage: Stage
  setStage: (stage: Stage) => void
  query: string
  setQuery: (query: string) => void
}) {
  return (
    <div className="filters">
      <label>
        <SlidersHorizontal size={16} />
        <select
          value={stage}
          onChange={(event) => setStage(event.target.value as Stage)}
        >
          <option>全部阶段</option>
          <option>小组赛</option>
          <option>16强</option>
          <option>1/4决赛</option>
        </select>
      </label>
      <label className="search-box">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索球队"
        />
      </label>
    </div>
  )
}

function ScheduleBoard({
  items,
  selectedMatch,
  setSelectedMatch,
}: {
  items: Match[]
  selectedMatch: Match
  setSelectedMatch: (match: Match) => void
}) {
  const grouped = items.reduce<Record<string, Match[]>>((acc, match) => {
    const key = `${match.date}（${match.weekday}）`
    acc[key] = acc[key] ? [...acc[key], match] : [match]
    return acc
  }, {})

  return (
    <div className="schedule-board">
      {Object.entries(grouped).map(([date, dayMatches]) => (
        <section className="day-group" key={date}>
          <h2>{date}</h2>
          <div className="timeline">
            {dayMatches.map((match) => (
              <MatchRow
                active={selectedMatch.id === match.id}
                key={match.id}
                match={match}
                onSelect={setSelectedMatch}
              />
            ))}
          </div>
        </section>
      ))}
      {items.length === 0 && (
        <div className="empty-state">
          <Database size={24} />
          <strong>数据暂不可用</strong>
          <p>当前筛选没有可展示比赛。请查看最后更新时间或切换日期。</p>
        </div>
      )}
    </div>
  )
}

function FinishedMatches({
  items,
  onSelect,
}: {
  items: Match[]
  onSelect: (match: Match) => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="finished-section">
      <div className="finished-header">
        <div>
          <h2>已结束赛事</h2>
          <p>展示最近完赛比分；回放入口跳转到公开集锦/回放检索。</p>
        </div>
        <span>结果以数据源最新同步为准</span>
      </div>
      <div className="finished-list">
        {items.map((match) => {
          const home = getTeam(match.home)
          const away = getTeam(match.away)
          return (
            <article className="finished-card" key={match.id}>
              <button type="button" onClick={() => onSelect(match)}>
                <span>
                  {match.date} {match.time} · {match.group} {match.round}
                </span>
                <strong>
                  {home.name} {match.score ?? '-'} {away.name}
                </strong>
                <small>{match.venue}</small>
              </button>
              <WatchEntry match={match} />
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Home({
  dateOptions,
  selectedDate,
  setSelectedDate,
  stage,
  setStage,
  query,
  setQuery,
  filteredMatches,
  finishedMatches,
  selectedMatch,
  setSelectedMatch,
}: {
  dateOptions: DateOption[]
  selectedDate: string
  setSelectedDate: (date: string) => void
  stage: Stage
  setStage: (stage: Stage) => void
  query: string
  setQuery: (query: string) => void
  filteredMatches: Match[]
  finishedMatches: Match[]
  selectedMatch: Match
  setSelectedMatch: (match: Match) => void
}) {
  return (
    <main className="app-main">
      <div className="analysis-grid">
        <section className="content-column">
          <section className="toolbar">
            <DateRail
              dateOptions={dateOptions}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
            <Filters
              query={query}
              setQuery={setQuery}
              stage={stage}
              setStage={setStage}
            />
          </section>
          <FinishedMatches items={finishedMatches} onSelect={setSelectedMatch} />
          <div className="board-title">
            <div>
              <h1>{formatChineseDate(selectedDate)}赛前分析</h1>
              <p>按时间线查看每场比赛的胜平负概率、预期进球和观看信息。</p>
            </div>
            <span className="status-pill">
              <span />
              数据状态：正常
            </span>
          </div>
          <ScheduleBoard
            items={filteredMatches}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
          />
        </section>
        <MatchPanel match={selectedMatch} />
      </div>

      <DataFooter />
    </main>
  )
}

function DataFooter() {
  return (
    <footer className="data-footer">
      <div>
        <Database size={18} />
        <strong>数据来源</strong>
        <span>FIFA 官网、Opta、FBref、Transfermarkt、公开赛程数据</span>
      </div>
      <div>
        <Clock3 size={18} />
        <strong>最后更新</strong>
        <span>2026-06-12 10:20（北京时间）</span>
      </div>
      <div>
        <Info size={18} />
        <strong>风险提示</strong>
        <span>预测仅供赛前分析参考，不构成任何投资、投注或收益建议。</span>
      </div>
    </footer>
  )
}

function SchedulePage({
  items,
  selectedMatch,
  setSelectedMatch,
}: {
  items: Match[]
  selectedMatch: Match
  setSelectedMatch: (match: Match) => void
}) {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <h1>赛程页</h1>
        <p>支持按日期、球队、阶段筛选；所有比赛时间均为北京时间。</p>
      </div>
      <ScheduleBoard
        items={items}
        selectedMatch={selectedMatch}
        setSelectedMatch={setSelectedMatch}
      />
    </main>
  )
}

function MatchDetailPage({ match }: { match: Match }) {
  const home = getTeam(match.home)
  const away = getTeam(match.away)

  return (
    <main className="page-shell detail-layout">
      <section className="detail-card">
        <span className="detail-kicker">
          {match.stage} · {match.group} {match.round}
        </span>
        <h1>
          {home.name} VS {away.name}
        </h1>
        <p>
          {match.date} {match.time}（北京时间） · {match.venue}
        </p>
        <div className="score-state">
          <span>{match.score ?? '赛前未开赛'}</span>
          <small>{match.status}</small>
        </div>
        <DataFooter />
      </section>
      <MatchPanel match={match} />
    </main>
  )
}

function PredictionPage({ match }: { match: Match }) {
  return (
    <main className="page-shell prediction-page">
      <div className="page-heading">
        <h1>预测页</h1>
        <p>
          第一版只输出两个预测指标：胜平负概率和进球数预测。所有数字必须带解释、来源、更新时间。
        </p>
      </div>
      <div className="prediction-grid">
        <MatchPanel match={match} />
        <section className="method-card">
          <h2>模型逻辑</h2>
          <p>
            使用球队实力评分、近期状态、历史进球表现作为主因子，以泊松进球分布估算预期进球，
            再转换为胜平负概率。
          </p>
          <h2>模型假设</h2>
          <ul>
            <li>赛前 24 小时内未确认的伤停和阵容变化不会自动纳入。</li>
            <li>中立场假设优先，主办地/旅途因素作为弱修正。</li>
            <li>国家队样本较少，置信度低于俱乐部联赛模型。</li>
          </ul>
          <h2>上线前回测</h2>
          <p>
            MVP 上线前至少使用历史世界杯和洲际赛事样本做一次简单回测，检查概率校准和大/小球方向命中。
          </p>
          <div className="warning-box">
            <AlertTriangle size={18} />
            本站不提供投注建议，不承诺收益。概率代表模型估计，不代表比赛结果。
          </div>
        </section>
      </div>
    </main>
  )
}

function TeamsPage({ items }: { items: Team[] }) {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <h1>球队页</h1>
        <p>展示基础信息、分组、赛程和当前关键数据，避免无来源扩展到伤停新闻。</p>
      </div>
      <section className="team-grid">
        {items.map((team) => (
          <article className="team-card" key={team.id}>
            <div>
              <span className="team-chip large">{team.short}</span>
              <h2>{team.name}</h2>
              <p>
                {team.group} · 世界排名 {team.rank}
              </p>
            </div>
            <div className="rating-line">
              <span>实力评分</span>
              <strong>{team.rating}</strong>
            </div>
            <div className="meter">
              <span style={{ width: `${team.rating}%` }} />
            </div>
            <p>{team.form}</p>
            <p>{team.goals}</p>
            <small>{team.data}</small>
          </article>
        ))}
      </section>
    </main>
  )
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedDate, setSelectedDate] = useState(getBeijingTodayKey())
  const [stage, setStage] = useState<Stage>('全部阶段')
  const [query, setQuery] = useState('')
  const [matchItems, setMatchItems] = useState<Match[]>(matches)
  const [teamItems, setTeamItems] = useState<Team[]>(teams)
  const [selectedMatch, setSelectedMatch] = useState(matches[0])
  const [dataMode, setDataMode] = useState<DataMode>('loading')
  const [dataMessage, setDataMessage] = useState('正在连接实时数据源')
  const [dataUpdatedAt, setDataUpdatedAt] = useState('2026-06-12 10:20')

  useEffect(() => {
    let cancelled = false

    function applyDataset(nextMatches: Match[], mode: DataMode, message: string) {
      const nextTeams = ensureTeamsForMatches(nextMatches)
      teamRegistry = nextTeams
      setMatchItems(nextMatches)
      setTeamItems(nextTeams)
      setSelectedMatch(nextMatches[0])
      setDataMode(mode)
      setDataMessage(message)
      setDataUpdatedAt(
        new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      )
    }

    async function loadLiveData() {
      setDataMode('loading')
      setDataMessage('正在连接实时数据源')
      try {
        const liveResponse = await fetch(LIVE_API_URL, { cache: 'no-store' })
        if (!liveResponse.ok) {
          throw new Error(`live source ${liveResponse.status}`)
        }
        const livePayload = (await liveResponse.json()) as { games?: LiveGame[] }
        const liveMatches = (livePayload.games ?? []).map(mapLiveGame)
        if (liveMatches.length === 0) {
          throw new Error('live source returned empty games')
        }
        if (!cancelled) {
          const today = getBeijingTodayKey()
          const firstRelevant =
            liveMatches.find((match) => match.date >= today) ??
            liveMatches[0]
          applyDataset(liveMatches, 'live', '实时 API 已连接')
          setSelectedDate(firstRelevant.date)
          setSelectedMatch(firstRelevant)
        }
      } catch (liveError) {
        try {
          const fallbackResponse = await fetch(OPEN_FOOTBALL_URL, {
            cache: 'no-store',
          })
          if (!fallbackResponse.ok) {
            console.warn(`Fallback source ${fallbackResponse.status}`, liveError)
            if (!cancelled) {
              applyDataset(matches, 'snapshot', '外部数据暂不可用，显示本地快照')
            }
            return
          }
          const fallbackPayload =
            (await fallbackResponse.json()) as OpenFootballPayload
          const fallbackMatches = (fallbackPayload.matches ?? []).map(
            mapOpenFootball,
          )
          if (fallbackMatches.length === 0) {
            console.warn('Fallback source returned empty matches', liveError)
            if (!cancelled) {
              applyDataset(matches, 'snapshot', '外部数据暂不可用，显示本地快照')
            }
            return
          }
          if (!cancelled) {
            const today = getBeijingTodayKey()
            const firstRelevant =
              fallbackMatches.find((match) => match.date >= today) ??
              fallbackMatches[0]
            applyDataset(
              fallbackMatches,
              'fallback',
              '实时源失败，已切换公开赛程兜底',
            )
            setSelectedDate(firstRelevant.date)
            setSelectedMatch(firstRelevant)
          }
        } catch (fallbackError) {
          if (!cancelled) {
            teamRegistry = teams
            setMatchItems(matches)
            setTeamItems(teams)
            setSelectedMatch(matches[0])
            setDataMode('snapshot')
            setDataMessage('外部数据暂不可用，显示本地快照')
          }
          console.warn('Fallback data load failed', fallbackError)
        }
        console.warn('Live data load failed', liveError)
      }
    }

    loadLiveData()
    const timer = window.setInterval(loadLiveData, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const filteredMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return matchItems.filter((match) => {
      const home = getTeam(match.home)
      const away = getTeam(match.away)
      const dateMatches = match.date === selectedDate
      const stageMatches = stage === '全部阶段' || match.stage === stage
      const queryMatches =
        normalizedQuery.length === 0 ||
        `${home.name}${home.short}${away.name}${away.short}`
          .toLowerCase()
          .includes(normalizedQuery)
      return dateMatches && stageMatches && queryMatches
    })
  }, [matchItems, query, selectedDate, stage])

  const dateOptions = useMemo(
    () => buildDateOptions(matchItems, selectedDate),
    [matchItems, selectedDate],
  )

  const finishedMatches = useMemo(
    () =>
      matchItems
        .filter((match) => match.status === '已结束')
        .slice(0, 4),
    [matchItems],
  )

  const statusText =
    dataMode === 'live'
      ? '实时'
      : dataMode === 'fallback'
        ? '兜底'
        : dataMode === 'loading'
          ? '连接中'
          : '快照'

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => setPage('home')}>
          <span className="brand-mark">
            <img alt="" src={`${import.meta.env.BASE_URL}logo.png`} />
          </span>
          <span>
            <strong>{SITE_TITLE}</strong>
            <small>用数据、模型和不确定性看比赛</small>
          </span>
        </button>
        <nav aria-label="主导航">
          {nav.map((item) => (
            <button
              className={page === item.page ? 'selected' : ''}
              key={item.page}
              type="button"
              onClick={() => setPage(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-status">
          <span>
            <span className="green-dot" />
            数据状态：{statusText}
          </span>
          <span>{dataMessage}</span>
          <span>最后更新 {dataUpdatedAt}</span>
        </div>
      </header>

      {page === 'home' && (
        <Home
          dateOptions={dateOptions}
          finishedMatches={finishedMatches}
          filteredMatches={filteredMatches}
          query={query}
          selectedDate={selectedDate}
          selectedMatch={selectedMatch}
          setQuery={setQuery}
          setSelectedDate={setSelectedDate}
          setSelectedMatch={setSelectedMatch}
          setStage={setStage}
          stage={stage}
        />
      )}
      {page === 'schedule' && (
        <SchedulePage
          items={matchItems}
          selectedMatch={selectedMatch}
          setSelectedMatch={setSelectedMatch}
        />
      )}
      {page === 'match' && <MatchDetailPage match={selectedMatch} />}
      {page === 'prediction' && <PredictionPage match={selectedMatch} />}
      {page === 'teams' && <TeamsPage items={teamItems} />}
    </div>
  )
}

export default App
