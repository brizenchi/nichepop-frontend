// Copy for loading, empty and not-yet-live states on the workspace pages (frontend#7).
// Real builds show these instead of demo data; demo builds never need them.

export const statesEn = {
  loading: 'Loading…',
  comingSoon: 'Coming soon',
  trendsSoon: 'The trend library is being built. Once it is live, new opportunities show up here every hour.',
  monthSoon: 'The 30-day view opens together with the trend library.',
  newKeywordsSoon: 'Today’s list opens together with the trend library.',
  noTrends: 'No new trends yet. New ones show up here as soon as they are found.',
  askSoon: 'The AI analyst is being connected to this page. Asking will work here soon.',
  noMonitors: 'No monitors yet',
  noMonitorsText: 'Watch a keyword, your product or a market. NichePop checks it for you and tells you what changed.',
  createMonitor: 'Create a monitor',
  paused: 'Paused',
}

export type StatesDictionary = typeof statesEn

export const statesZh: StatesDictionary = {
  loading: '加载中…',
  comingSoon: '即将上线',
  trendsSoon: '机会库正在建设中。上线后，这里每小时都会出现新的机会。',
  monthSoon: '近 30 天视图会和机会库一起上线。',
  newKeywordsSoon: '今天的新词榜会和机会库一起上线。',
  noTrends: '还没有新的趋势，发现新词后会第一时间出现在这里。',
  askSoon: 'AI 分析师正在接入这个页面，很快就能在这里提问。',
  noMonitors: '还没有监控',
  noMonitorsText: '盯住一个关键词、你的产品或一个赛道，NichePop 会替你定时检查，有变化就告诉你。',
  createMonitor: '新建监控',
  paused: '已暂停',
}
